import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { ApiFlagshipHouseholdStore } from '@/api/flagshipHouseholdStore';
import { fetchPolicyById } from '@/api/policy';
import { useV3SavedWork } from '@/hooks/useFlagshipStores';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { useV3Policies } from '@/hooks/useV3Policies';
import { useParallelQueries } from '@/hooks/utils/queryUtils';
import type { CountryId } from '@/libs/countries';
import { runFlagshipHouseholdPayload } from '@/libs/flagship/householdRun';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
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
  onCreated,
}: {
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household asked for; nothing runs while null. */
  payload: V1HouseholdCreateEnvelope | null;
  /** Called with the household's ID once the API has stored it, while it is calculated. */
  onCreated?: (householdId: string, payload: V1HouseholdCreateEnvelope) => void;
}) {
  // The latest callback, outside the query's key.
  const created = useRef(onCreated);
  created.current = onCreated;
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
      runFlagshipHouseholdPayload({
        year,
        payload: payload!,
        baselinePolicyId,
        reformPolicyId,
        onCreated: (householdId) => created.current?.(householdId, payload!),
      }),
    enabled: !!payload,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

interface HouseholdPoliciesArgs {
  countryId: string;
  policyIds: string[];
  enabled: boolean;
}

/** On the v1 routes: as before v3 loaded parameters on demand. */
function useV1HouseholdPolicies({ countryId, policyIds, enabled }: HouseholdPoliciesArgs) {
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
 * On the v2 routes: read as stored, then parsed once the parameters each
 * names are in, as the report page reads them (under the same keys).
 */
function useV2HouseholdPolicies({ countryId, policyIds, enabled }: HouseholdPoliciesArgs) {
  const results = useV3Policies(countryId, policyIds, enabled);
  const { policies } = results;
  const error =
    results.failedPolicyIds.length > 0
      ? new Error(`Could not load policy ${results.failedPolicyIds.join(', ')}`)
      : null;
  return {
    policies,
    /** Waiting for the model's parameters, or for a policy. */
    isLoading: enabled && !error && policies.length < new Set(policyIds).size,
    error,
    retry: results.retry,
  };
}

/**
 * The report's policies in the app's model, for the v2 household
 * breakdowns that send a policy's parameters with their request (earnings
 * variation, marginal tax rates). Fetched as the report page fetches them,
 * under the same keys, so a policy the page already holds is not fetched
 * again. Nothing runs until `enabled`. The routes v3 uses (V3_API_ROUTES,
 * a constant) pick the implementation.
 */
export const useFlagshipHouseholdPolicies =
  V3_API_ROUTES === 'v2' ? useV2HouseholdPolicies : useV1HouseholdPolicies;

/**
 * Saves each household the report calculates to the session's user, in the
 * background: a `/v2/user-households` row for its v1 household. Only where
 * saved work goes to the account (see useV3SavedWork), and in the account's
 * country. Once saved, a household is not looked up or saved again on the
 * page, even when the session ends on it. A failed save is logged to the
 * console and tried again the next time the household's result shows, or
 * when the session's user changes while it shows. Nothing shows the row, so
 * a failure changes nothing on the page.
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
  const { account } = useV3SavedWork();
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
        // Not keyed by the session's user: a session that ends on the page
        // must not save the household on screen again as this browser's
        // user, which signing in would then merge into the account twice.
        queryKey: ['flagship-household-saved', countryId, householdId],
        queryFn: () => store.saveCalculated({ householdId, name }),
        staleTime: Infinity,
        // Kept for the page's life, so a saved household is not looked up again.
        gcTime: Infinity,
        retry: false,
      })
      .catch((error: unknown) => {
        // Nothing on the page reads the row, so a failure is only logged.
        console.error('[useSaveCalculatedHousehold] Save failed:', error);
      });
  }, [account, countryId, householdId, name, queryClient]);
}
