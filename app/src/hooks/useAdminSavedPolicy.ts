import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { components } from '@/api/publicApi/schema';
import {
  fetchV2PolicyItem,
  parametersFromPolicyJson,
  parametersFromV2Policy,
} from '@/api/reformStore';
import { isLegacyId } from '@/api/v2Associations';
import { policyMissingParameters } from '@/libs/flagship/missingParameters';
import { fetchV1Policy } from '@/libs/flagship/policyChecks';
import { V1_POLICY_GC_TIME, v1PolicyKey, V2_POLICY_GC_TIME, v2PolicyKey } from '@/libs/queryKeys';
import type { RootState } from '@/store';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';

/** One of a user's saved policies, as the admin's saved-items read returns it. */
export type AdminSavedPolicy = components['schemas']['UserPolicyItem'];

type V2Policy = components['schemas']['PolicyItem'];

/** What a saved policy's panel shows of the policy it points to. */
export interface AdminSavedPolicyContent {
  /** The parameters it sets, each with the periods it sets them for. */
  parameters: Parameter[];
  /** The parameter paths it sets that the model no longer has, as the API reports them. */
  missingParameters: string[];
}

/**
 * The content of the policy a saved policy record points to: a v2 policy
 * (`policy_id`), or a v1 policy (`legacy_policy_id`) for one saved before
 * the detailed-save API. Both reads are public and change nothing.
 *
 * Policies never change, so each is read once and kept, under the keys the
 * reform stores read them by. As the reform stores read them, a failed read
 * is not retried: the panel offers "Try again". With `enabled` false
 * nothing is read. A record that points to neither kind of policy fails.
 */
export function useAdminSavedPolicyContent(policy: AdminSavedPolicy, enabled: boolean) {
  const parameterMetadata = useSelector((state: RootState) => state.metadata.parameters);
  const countryId = policy.country_id;
  const v2PolicyId = policy.policy_id;
  const v1PolicyId = isLegacyId(policy.legacy_policy_id) ? String(policy.legacy_policy_id) : null;
  return useQuery<V2Policy | PolicyMetadata, Error, AdminSavedPolicyContent>({
    // A record that points to no policy has its own key: its failure is its own.
    queryKey: v2PolicyId
      ? v2PolicyKey(countryId, v2PolicyId)
      : v1PolicyId
        ? v1PolicyKey(countryId, v1PolicyId)
        : ['saved-policy-without-policy', policy.id],
    queryFn: () => {
      if (v2PolicyId) {
        return fetchV2PolicyItem(countryId, v2PolicyId);
      }
      if (v1PolicyId) {
        return fetchV1Policy(countryId, v1PolicyId);
      }
      return Promise.reject(new Error('This saved policy points to no policy.'));
    },
    select: (read) => ({
      parameters:
        'parameter_values' in read
          ? parametersFromV2Policy(read)
          : parametersFromPolicyJson(read.policy_json, parameterMetadata),
      missingParameters: policyMissingParameters(read),
    }),
    enabled,
    staleTime: Infinity,
    gcTime: v2PolicyId ? V2_POLICY_GC_TIME : V1_POLICY_GC_TIME,
    retry: false,
  });
}
