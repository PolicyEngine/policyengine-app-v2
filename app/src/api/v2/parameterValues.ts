import type { V2ParameterValueMetadata } from '@/types/metadata';
import { API_V2_BASE_URL } from './taxBenefitModels';

/**
 * Special constant to indicate baseline (current law) values.
 * Baseline values have policy_id = null in the database.
 * When fetching baseline values, we omit the policy_id parameter entirely.
 */
export const BASELINE_POLICY_ID = 'baseline' as const;

/**
 * Fetch parameter values for a specific parameter and policy.
 *
 * All parameter values are stored separately and linked to a policy.
 * Both baseline (current law) and reform policies have their own sets of values.
 *
 * @param parameterId - The ID of the parameter to fetch values for
 * @param policyId - The ID of the policy, or "baseline" for current law values (omits policy_id from query)
 * @returns Array of parameter value records
 */
export async function fetchParameterValues(
  parameterId: string,
  policyId: string
): Promise<V2ParameterValueMetadata[]> {
  const params = new URLSearchParams();
  params.set('parameter_id', parameterId);

  // For baseline (current law), omit policy_id to get values where policy_id IS NULL
  // For reform policies, include the actual policy UUID
  if (policyId !== BASELINE_POLICY_ID) {
    params.set('policy_id', policyId);
  }

  const res = await fetch(`${API_V2_BASE_URL}/parameter-values/?${params.toString()}`);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch parameter values for parameter ${parameterId} with policy ${policyId}`
    );
  }

  return res.json();
}
