import { useQuery } from '@tanstack/react-query';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { fetchPolicyById } from '@/api/policy';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { useV3Policies } from '@/hooks/useV3Policies';
import { useParallelQueries } from '@/hooks/utils/queryUtils';
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
