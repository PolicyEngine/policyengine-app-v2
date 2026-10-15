/**
 * Whether a report was compared with something other than current law, by
 * the policy its baseline simulation ran. That stays true when its record
 * no longer names the saved reform it was compared with: the reform was
 * deleted, or the report is someone else's, recomputed. Undefined while
 * either policy is unknown.
 */
export function ranAgainstReform(
  baselinePolicyId: string | number | null | undefined,
  currentLawPolicyId: string | number | null | undefined
): boolean | undefined {
  if (baselinePolicyId == null || baselinePolicyId === '' || currentLawPolicyId == null) {
    return undefined;
  }
  return String(baselinePolicyId) !== String(currentLawPolicyId);
}

/** How a report compared with a reform it can no longer name reads: "Compared with a saved reform". */
export const UNNAMED_COMPARISON = 'a saved reform';
