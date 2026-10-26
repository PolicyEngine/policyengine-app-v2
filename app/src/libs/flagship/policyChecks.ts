import type { QueryClient } from '@tanstack/react-query';
import { fetchPolicyById } from '@/api/policy';
import { V1_POLICY_GC_TIME, v1PolicyKey } from '@/libs/queryKeys';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';

/**
 * A v1 policy, with an empty parameter map when it stores none. v1
 * policies never change once created; `missing_parameters` changes only
 * when the API's model does.
 */
export async function fetchV1Policy(countryId: string, policyId: string): Promise<PolicyMetadata> {
  const policy = await fetchPolicyById(countryId, policyId);
  return { ...policy, policy_json: policy.policy_json ?? {} };
}

/**
 * A v1 policy through the query cache: read once per session, and shared
 * by the reform stores and the report page.
 */
export function readV1Policy(
  queryClient: QueryClient,
  countryId: string,
  policyId: string
): Promise<PolicyMetadata> {
  return queryClient.fetchQuery({
    queryKey: v1PolicyKey(countryId, policyId),
    queryFn: () => fetchV1Policy(countryId, policyId),
    staleTime: Infinity,
    gcTime: V1_POLICY_GC_TIME,
  });
}
