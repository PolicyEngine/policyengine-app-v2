import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { PolicyColumn } from '@/utils/policyTableHelpers';

/**
 * Get user-specified policy label, falling back to policy label
 */
export function getPolicyLabel(policy: Policy | undefined, userPolicies?: UserPolicy[]): string {
  if (!policy) {
    return 'Unnamed Policy';
  }
  const userPolicy = userPolicies?.find((up) => up.policyId === policy.id);
  return userPolicy?.label || policy.label || 'Unnamed Policy';
}

/**
 * Build header text for a policy column
 * Examples:
 * - Single policy: "Policy Name (BASELINE)"
 * - Merged column: "Policy Name (BASELINE / REFORM)"
 * - Current law policy: "Policy Name (CURRENT LAW / BASELINE)"
 */
export function buildColumnHeaderText(
  column: PolicyColumn,
  userPolicies?: UserPolicy[],
  currentLawId?: number
): string {
  const policyNames = column.policies.map((p) => getPolicyLabel(p, userPolicies));
  const roleLabels = column.label.toUpperCase().split(' / ');

  // Check if the first policy is current law
  const isCurrentLaw =
    currentLawId !== undefined && column.policies[0]?.id === String(currentLawId);

  // Build role text - prepend "CURRENT LAW / " to role if this policy is current law
  const roleText = isCurrentLaw
    ? `CURRENT LAW / ${roleLabels.join(' / ')}`
    : roleLabels.join(' / ');

  return `${policyNames[0].toUpperCase()} (${roleText})`;
}
