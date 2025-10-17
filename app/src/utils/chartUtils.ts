/**
 * General chart utility functions
 */

/**
 * Gets the label for the reform policy line in parameter charts
 *
 * Priority order:
 * 1. Policy label (if provided)
 * 2. Policy ID formatted as "Policy #123" (if provided)
 * 3. Default "Reform" label
 *
 * @param policyLabel - Optional custom label for the policy
 * @param policyId - Optional policy ID number
 * @returns The label to display for the reform line
 */
export function getReformPolicyLabel(
  policyLabel?: string | null,
  policyId?: number | null
): string {
  if (policyLabel) {
    return policyLabel;
  }

  if (policyId !== null && policyId !== undefined) {
    return `Policy #${policyId}`;
  }

  return 'Reform';
}
