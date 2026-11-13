import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { components } from '@/api/publicApi/schema';
import {
  fetchV2PolicyItem,
  parametersFromPolicyJson,
  parametersFromV2Policy,
} from '@/api/reformStore';
import { isLegacyId } from '@/api/v2Associations';
import { fetchV1Policy } from '@/libs/flagship/policyChecks';
import { V1_POLICY_GC_TIME, v1PolicyKey, v2PolicyKey } from '@/libs/queryKeys';
import type { RootState } from '@/store';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import { retryTemporaryFailures } from './useAdminUsers';

/** One of a user's saved policies, as the admin's saved-items read returns it. */
export type AdminSavedPolicy = components['schemas']['UserPolicyItem'];

type V2Policy = components['schemas']['PolicyItem'];

/**
 * The parameters a saved policy sets, each with the periods it sets them
 * for, read from the policy the record points to: a v2 policy
 * (`policy_id`), or a v1 policy (`legacy_policy_id`) for one saved before
 * the detailed-save API. Both reads are public and change nothing.
 *
 * Policies never change, so each is read once and kept, under the keys the
 * reform stores read them by. With `enabled` false nothing is read. A
 * record that points to neither kind of policy fails.
 */
export function useAdminSavedPolicyParameters(policy: AdminSavedPolicy, enabled: boolean) {
  const queryClient = useQueryClient();
  const parameterMetadata = useSelector((state: RootState) => state.metadata.parameters);
  const countryId = policy.country_id;
  const v2PolicyId = policy.policy_id;
  const v1PolicyId = isLegacyId(policy.legacy_policy_id) ? String(policy.legacy_policy_id) : null;
  return useQuery<V2Policy | PolicyMetadata, Error, Parameter[]>({
    queryKey: v2PolicyId
      ? v2PolicyKey(countryId, v2PolicyId)
      : v1PolicyKey(countryId, v1PolicyId ?? ''),
    queryFn: () => {
      if (v2PolicyId) {
        return fetchV2PolicyItem(countryId, v2PolicyId);
      }
      if (v1PolicyId) {
        return fetchV1Policy(countryId, v1PolicyId);
      }
      return Promise.reject(new Error('This saved policy points to no policy.'));
    },
    select: (read) =>
      'parameter_values' in read
        ? parametersFromV2Policy(read)
        : parametersFromPolicyJson(read.policy_json, parameterMetadata),
    enabled,
    staleTime: Infinity,
    gcTime: V1_POLICY_GC_TIME,
    retry: retryTemporaryFailures(queryClient),
  });
}
