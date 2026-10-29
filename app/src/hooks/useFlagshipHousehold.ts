import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { fetchPolicyById } from '@/api/policy';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { useV3Policies } from '@/hooks/useV3Policies';
import { useParallelQueries } from '@/hooks/utils/queryUtils';
import { runFlagshipHouseholdPayload } from '@/libs/flagship/householdRun';
import { runV2FlagshipHousehold, v2PolicyIdFor } from '@/libs/flagship/v2HouseholdRun';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import { policyKeys } from '@/libs/queryKeys';
import type { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import type { RootState } from '@/store';
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

/** The household a run was asked for, and the payload sent for it. */
export interface RequestedHousehold {
  household: Household;
  payload: V1HouseholdCreateEnvelope;
}

interface HouseholdRunQueryArgs {
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household asked for; nothing runs while null. */
  requested: RequestedHousehold | null;
}

/** On the v1 routes: the household is created and calculated through v1's household routes. */
function useV1HouseholdRunQuery({
  year,
  baselinePolicyId,
  reformPolicyId,
  requested,
}: HouseholdRunQueryArgs) {
  return useFlagshipHouseholdPayload({
    year,
    baselinePolicyId,
    reformPolicyId,
    payload: requested?.payload ?? null,
  });
}

/**
 * On the v2 routes: the household is stored and calculated through
 * `/v2/household-calculations`, current law as no policy and a reform by
 * its v2 policy. Keyed by what is sent, as on the v1 routes.
 */
function useV2HouseholdRunQuery({
  year,
  baselinePolicyId,
  reformPolicyId,
  requested,
}: HouseholdRunQueryArgs) {
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  return useQuery({
    queryKey: [
      'flagship-household-v2',
      requested?.payload.country_id ?? null,
      year,
      baselinePolicyId,
      reformPolicyId,
      currentLawId,
      requested?.payload ?? null,
    ],
    queryFn: ({ signal }) =>
      runV2FlagshipHousehold(
        {
          year,
          household: requested!.household,
          baselinePolicyId: v2PolicyIdFor(baselinePolicyId, currentLawId),
          reformPolicyId: v2PolicyIdFor(reformPolicyId, currentLawId),
        },
        { signal }
      ),
    enabled: !!requested,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/** A requested household's run on the routes v3 uses (V3_API_ROUTES, a constant). */
const useHouseholdRunQuery =
  V3_API_ROUTES === 'v2' ? useV2HouseholdRunQuery : useV1HouseholdRunQuery;

const samePayload = (first: V1HouseholdCreateEnvelope, second: V1HouseholdCreateEnvelope) =>
  JSON.stringify(first) === JSON.stringify(second);

/**
 * A v3 household result's run, asked for when the reader presses
 * Calculate, for the report section's households and the standalone
 * household report alike. The household asked for is fixed when asked,
 * so the result keeps describing it while the reader edits the builder.
 */
export function useRequestedHouseholdRun({
  year,
  baselinePolicyId,
  reformPolicyId,
}: {
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
}) {
  const [requested, setRequested] = useState<RequestedHousehold | null>(null);
  const run = useHouseholdRunQuery({ year, baselinePolicyId, reformPolicyId, requested });
  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;

  /**
   * Asks for a household's run. The same household again is the same
   * query, which keeps its error until asked again, so it asks once more.
   */
  const request = (household: Household) => {
    const payload = household.toV1CreationPayload();
    if (requested && samePayload(requested.payload, payload)) {
      void run.refetch();
    } else {
      setRequested({ household, payload });
    }
  };

  return {
    /** The household asked for; null until Calculate. */
    requested,
    /** The run's query, for its data and error. */
    run,
    running,
    failed,
    /** The run's result, once it has one and is not running again. */
    result: requested && !running ? run.data : undefined,
    request,
    /**
     * After a failure: the household as it is now when it can run, so an
     * input fixed after the failure counts; otherwise the household that
     * failed, once more, never one that cannot run.
     */
    retry: (household: Household, canRun: boolean) => {
      if (canRun) {
        request(household);
      } else {
        void run.refetch();
      }
    },
    /** Forgets the request and its result: the next result waits for Calculate. */
    clear: () => setRequested(null),
    /** Whether the household on screen, or on its way, is this one. */
    shows: (household: Household) =>
      !!requested && !failed && samePayload(requested.payload, household.toV1CreationPayload()),
  };
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
