import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { ApiFlagshipHouseholdStore } from '@/api/flagshipHouseholdStore';
import { fetchPolicyById } from '@/api/policy';
import { useV3SavedWork } from '@/hooks/useFlagshipStores';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { useParallelQueries } from '@/hooks/utils/queryUtils';
import type { CountryId } from '@/libs/countries';
import { runFlagshipHouseholdPayload } from '@/libs/flagship/householdRun';
import { policyKeys } from '@/libs/queryKeys';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { Policy } from '@/types/ingredients/Policy';

/**
 * A household built in full (the household builder's model), run for a
 * report once the reader asks, in the payload's own country. Keyed by what is sent, so the same
 * household is not run twice on a page.
 */
export function useFlagshipHouseholdPayload({
  year,
  baselinePolicyId,
  reformPolicyId,
  payload,
}: {
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household asked for; nothing runs while null. */
  payload: V1HouseholdCreateEnvelope | null;
}) {
  return useQuery({
    queryKey: [
      'flagship-household-full',
      payload?.country_id ?? null,
      year,
      baselinePolicyId,
      reformPolicyId,
      payload,
    ],
    queryFn: () =>
      runFlagshipHouseholdPayload({ year, payload: payload!, baselinePolicyId, reformPolicyId }),
    enabled: !!payload,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * The report's policies in the app's model, for the v2 household
 * breakdowns that send a policy's parameters with their request (earnings
 * variation, marginal tax rates). Fetched as the report page fetches them,
 * under the same keys, so a policy the page already holds is not fetched
 * again. Nothing runs until `enabled`.
 */
export function useFlagshipHouseholdPolicies({
  countryId,
  policyIds,
  enabled,
}: {
  countryId: string;
  policyIds: string[];
  enabled: boolean;
}) {
  const { parameters, isReady } = useParameterMetadata(countryId);
  const results = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (policyId) =>
      PolicyAdapter.fromMetadata(await fetchPolicyById(countryId, policyId), parameters),
    enabled: enabled && isReady && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });
  const policies = results.queries
    .map((query) => query.data)
    .filter((policy): policy is Policy => !!policy);
  const error = (results.error as Error | null) ?? null;
  return {
    policies,
    /** Waiting for the model's parameters, or for a policy. */
    isLoading: enabled && !error && policies.length < new Set(policyIds).size,
    error,
    retry: () => Promise.all(results.queries.map((query) => query.refetch())),
  };
}

/**
 * Saves each household the report calculates to the session's user, in the
 * background: a `/v2/user-households` row for its v1 household, looked up
 * and made once per household and session. Only where saved work goes to the
 * account (see useV3SavedWork), and in the account's country. Nothing shows
 * the row, so a save that fails changes nothing on the page.
 */
export function useSaveCalculatedHousehold({
  countryId,
  household,
}: {
  countryId: CountryId;
  /**
   * The calculated v1 household and its summary, which names the row;
   * nothing is saved while there is none.
   */
  household: { id: string; name: string } | undefined;
}) {
  const { account, scope } = useV3SavedWork();
  const queryClient = useQueryClient();
  const householdId = household?.id;
  const name = household?.name;
  useEffect(() => {
    if (!account || account.countryId !== countryId || !householdId || name === undefined) {
      return;
    }
    const store = new ApiFlagshipHouseholdStore(account);
    queryClient
      .fetchQuery({
        queryKey: ['flagship-household-saved', scope, countryId, householdId],
        queryFn: () => store.saveCalculated({ householdId, name }),
        staleTime: Infinity,
        // Kept for the session, so the same household is not looked up again.
        gcTime: Infinity,
        retry: false,
      })
      .catch(() => {
        // Nothing on the page reads the row, so a failed save is left alone.
      });
  }, [account, scope, countryId, householdId, name, queryClient]);
}
