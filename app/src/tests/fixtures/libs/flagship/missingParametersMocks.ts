/**
 * Parameter paths that older saved policies set but the current model no
 * longer has: a US income tax bracket renamed in a later release, and a UK
 * parameter that was removed.
 */
export const REMOVED_US_PARAMETER = 'gov.irs.income.bracket.thresholds.1.WIDOW';
export const REMOVED_UK_PARAMETER = 'gov.abolitions.business_rates';
export const REMOVED_PARAMETERS = [REMOVED_US_PARAMETER, REMOVED_UK_PARAMETER];

/** A v1 policy's content as `GET /{country}/policy/{id}` returns it. */
export function v1PolicyContent(
  policyJson: Record<string, Record<string, unknown>>,
  missingParameters?: string[] | null
) {
  return missingParameters === undefined
    ? { policy_json: policyJson }
    : { policy_json: policyJson, missing_parameters: missingParameters };
}
