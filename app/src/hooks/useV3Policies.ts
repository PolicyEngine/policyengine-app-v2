import { useMemo } from 'react';
import { useQueries, type QueryObserverResult } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters';
import { fetchPolicyById } from '@/api/policy';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import { useParallelQueries } from '@/hooks/utils/queryUtils';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';
import { policyKeys } from '@/libs/queryKeys';
import type { RootState } from '@/store';
import type { Policy } from '@/types/ingredients/Policy';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';

/**
 * The policies a v3 report shows, in the app's model. A policy is parsed
 * against the metadata of the parameters it names (which types its
 * values). On the v1 routes each policy is read and parsed once the whole
 * metadata is in, as before v3 loaded parameters on demand. On the v2
 * routes each is first read as stored (`GET /{country}/policy/{id}`), then
 * the parameters it names load in one request, then it is parsed. A policy
 * that cannot be read or parsed, or whose parameters fail to load, is
 * listed as failed.
 */
export interface V3Policies {
  policies: Policy[];
  /** The policies that failed to load or parse, with nothing to show. */
  failedPolicyIds: string[];
  /** Waiting for a policy, or (on the v2 routes) for the parameters it names. */
  isLoading: boolean;
  /** Asks again for whatever failed. */
  retry: () => Promise<unknown>;
}

function useV1Policies(countryId: string, policyIds: string[], enabled: boolean): V3Policies {
  const { parameters, isReady } = useParameterMetadata(countryId);
  const results = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (policyId) =>
      PolicyAdapter.fromMetadata(await fetchPolicyById(countryId, policyId), parameters),
    enabled: enabled && isReady && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });
  return {
    policies: results.queries
      .map((query) => query.data)
      .filter((policy): policy is Policy => !!policy),
    failedPolicyIds: policyIds.filter((_, index) => {
      const query = results.queries[index];
      return !!query?.error && !query.data;
    }),
    isLoading: results.isLoading,
    retry: () =>
      Promise.all(results.queries.filter((query) => query.error).map((query) => query.refetch())),
  };
}

interface StoredPolicies {
  data: (PolicyMetadata | undefined)[];
  /** Read and failed, with nothing to show. */
  failed: boolean[];
  isLoading: boolean;
  refetchFailed: () => Promise<unknown>;
}

/**
 * The stored policies' results, kept by the query library while nothing
 * changes (it compares this result deeply), so what is parsed from them
 * keeps its identity from render to render.
 */
function combineStoredPolicies(results: QueryObserverResult<PolicyMetadata>[]): StoredPolicies {
  return {
    data: results.map((result) => result.data),
    failed: results.map((result) => !!result.error && !result.data),
    isLoading: results.some((result) => result.isLoading),
    refetchFailed: () =>
      Promise.all(results.filter((result) => result.error).map((result) => result.refetch())),
  };
}

function parse(stored: PolicyMetadata, parameters: RootState['metadata']['parameters']) {
  try {
    return PolicyAdapter.fromMetadata(stored, parameters);
  } catch {
    return null;
  }
}

function namedParameters(stored: PolicyMetadata | undefined): string[] {
  return stored ? Object.keys(stored.policy_json ?? {}) : [];
}

function useV2Policies(countryId: string, policyIds: string[], enabled: boolean): V3Policies {
  const uniqueIds = [...new Set(policyIds)];
  const stored = useQueries({
    queries: uniqueIds.map((policyId) => ({
      queryKey: policyKeys.storedById(policyId),
      queryFn: () => fetchPolicyById(countryId, policyId),
      enabled,
      staleTime: 5 * 60 * 1000,
    })),
    combine: combineStoredPolicies,
  });
  const names = [...new Set(stored.data.flatMap(namedParameters))];
  const parameterStatus = useEnsureV3Parameters(names);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const ready = parameterStatus.status === 'ready';
  const parametersFailed = parameterStatus.status === 'error';

  // Undefined: not parsed yet; null: failed. A policy that names no
  // parameter (current law) needs none of them loaded.
  const parsed = useMemo(
    () =>
      stored.data.map((policy) =>
        policy && (ready || namedParameters(policy).length === 0)
          ? parse(policy, parameters)
          : undefined
      ),
    [stored.data, ready, parameters]
  );
  const policies = useMemo(() => parsed.filter((policy): policy is Policy => !!policy), [parsed]);

  const failedPolicyIds = uniqueIds.filter(
    (_, index) =>
      stored.failed[index] ||
      parsed[index] === null ||
      (parametersFailed && !!stored.data[index] && parsed[index] === undefined)
  );
  const waitingForParameters = parameterStatus.waiting && stored.data.some(Boolean);
  return {
    policies,
    failedPolicyIds,
    isLoading: enabled && (stored.isLoading || waitingForParameters),
    retry: () =>
      Promise.all([stored.refetchFailed(), parametersFailed ? parameterStatus.retry() : null]),
  };
}

/** The report's policies for the routes v3 uses (V3_API_ROUTES, a constant). */
export const useV3Policies: (
  countryId: string,
  policyIds: string[],
  enabled: boolean
) => V3Policies = V3_API_ROUTES === 'v2' ? useV2Policies : useV1Policies;
