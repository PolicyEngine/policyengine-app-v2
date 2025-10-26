import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { PolicyColumn } from '@/utils/policyTableHelpers';

/**
 * Get user-specified policy label, falling back to policy label
 */
export function getPolicyLabel(
  policy: Policy | undefined,
  userPolicies?: UserPolicy[]
): string {
  if (!policy) return 'Unnamed Policy';
  const userPolicy = userPolicies?.find((up) => up.policyId === policy.id);
  return userPolicy?.label || policy.label || 'Unnamed Policy';
}

/**
 * Build header text for a policy column
 * Examples:
 * - Single policy: "Policy Name (BASELINE)"
 * - Merged column: "Policy Name (BASELINE / REFORM)"
 */
export function buildColumnHeaderText(
  column: PolicyColumn,
  userPolicies?: UserPolicy[]
): string {
  const policyNames = column.policies.map((p) => getPolicyLabel(p, userPolicies));
  const roleLabels = column.label.toUpperCase().split(' / ');

  // If single policy, show "Name (ROLE)"
  // If merged, show "Name (ROLE1 / ROLE2)"
  return policyNames.length === 1
    ? `${policyNames[0].toUpperCase()} (${roleLabels[0]})`
    : `${policyNames[0].toUpperCase()} (${roleLabels.join(' / ')})`;
}
