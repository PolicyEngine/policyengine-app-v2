import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters';
import { fetchPolicyById } from '@/api/policy';
import { useEnsureV3Parameters } from '@/hooks/useV3Parameters';
import { useParallelQueries } from '@/hooks/utils/queryUtils';
import { policyKeys } from '@/libs/queryKeys';
import type { RootState } from '@/store';
import type { Policy } from '@/types/ingredients/Policy';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';

/**
 * The policies a v3 report shows, in the app's model. A policy is parsed
 * against the metadata of the parameters it names (which types its
 * values), so each is first read as stored (`GET /{country}/policy/{id}`),
 * then the parameters it names are made sure of, then it is parsed. On the
 * v1 routes the whole metadata holds every parameter; on the v2 routes the
 * named ones load in one request. A policy that cannot be read or parsed is
 * listed as failed.
 */
export interface V3Policies {
  policies: Policy[];
  /** The policies that failed to load or parse, with nothing to show. */
  failedPolicyIds: string[];
  /** Waiting for a policy, or for the parameters it names. */
  isLoading: boolean;
  /** Asks again for whatever failed. */
  retry: () => Promise<unknown>;
}

function parse(stored: PolicyMetadata, parameters: RootState['metadata']['parameters']) {
  try {
    return PolicyAdapter.fromMetadata(stored, parameters);
  } catch {
    return null;
  }
}

export function useV3Policies(
  countryId: string,
  policyIds: string[],
  enabled: boolean
): V3Policies {
  const stored = useParallelQueries<PolicyMetadata>(policyIds, {
    queryKey: policyKeys.storedById,
    queryFn: (policyId) => fetchPolicyById(countryId, policyId),
    enabled: enabled && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const storedPolicies = stored.queries.map((query) => query.data);
  // A report holds two or three policies, so naming and parsing them on
  // each render costs little; the parameter load compares names by content.
  const names = [
    ...new Set(
      storedPolicies.flatMap((policy) => (policy ? Object.keys(policy.policy_json ?? {}) : []))
    ),
  ];
  const parameterStatus = useEnsureV3Parameters(names);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const ready = parameterStatus.status === 'ready';
  const parsed = storedPolicies.map((policy) =>
    policy && ready ? parse(policy, parameters) : undefined
  );

  const failedPolicyIds = policyIds.filter((_, index) => {
    const query = stored.queries[index];
    return (!!query?.error && !query.data) || parsed[index] === null;
  });
  const policies = parsed.filter((policy): policy is Policy => !!policy);
  const waitingForParameters = storedPolicies.some(Boolean) && parameterStatus.status === 'loading';
  return {
    policies,
    failedPolicyIds,
    isLoading: enabled && (stored.isLoading || waitingForParameters),
    retry: () =>
      Promise.all([
        ...stored.queries.filter((query) => query.error).map((query) => query.refetch()),
        parameterStatus.status === 'error' ? parameterStatus.retry() : null,
      ]),
  };
}
