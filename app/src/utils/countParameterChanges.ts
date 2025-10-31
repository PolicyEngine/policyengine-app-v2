import { PolicyMetadata } from '@/types/metadata/policyMetadata';

/**
 * Counts the number of parameter changes in a policy.
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
