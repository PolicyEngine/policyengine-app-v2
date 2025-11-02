import { Policy } from '@/types/ingredients/Policy';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';

/**
 * Counts the number of parameter changes in a policy metadata object.
 * Each parameter can have multiple date ranges, and each date range counts as one change.
 *
 * @param policy - The policy metadata to count parameter changes for
 * @returns The total number of parameter changes across all parameters
 */
export const countParameterChanges = (policy: PolicyMetadata | undefined): number => {
  if (!policy?.policy_json) {
    return 0;
  }

  let count = 0;

  for (const paramName in policy.policy_json) {
    if (policy.policy_json[paramName]) {
      count += Object.keys(policy.policy_json[paramName]).length;
    }
  }

  return count;
};

/**
 * Counts the number of value intervals (parameter modifications) in a Redux Policy object.
 * Each value interval in each parameter counts as one modification.
 *
 * @param policy - The Redux policy to count modifications for
 * @returns The total number of value intervals across all parameters
 */
export const countPolicyModifications = (policy: Policy | undefined | null): number => {
  if (!policy?.parameters) {
    return 0;
  }

  let count = 0;

  for (const param of policy.parameters) {
    if (param.values) {
      count += param.values.length;
    }
  }

  return count;
};
