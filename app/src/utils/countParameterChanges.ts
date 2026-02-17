import { Policy } from '@/types/ingredients/Policy';

/**
 * Counts the number of value intervals (parameter modifications) in a Policy object.
 * Each value interval in each parameter counts as one modification.
 *
 * @param policy - The policy to count modifications for
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
