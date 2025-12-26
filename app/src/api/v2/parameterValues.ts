import { API_V2_BASE_URL } from "./taxBenefitModels";
import type { V2ParameterValueMetadata } from "@/types/metadata";

/**
 * Fetch parameter values for a specific parameter and policy.
 *
 * All parameter values are stored separately and linked to a policy.
 * Both baseline (current law) and reform policies have their own sets of values.
 *
 * @param parameterId - The ID of the parameter to fetch values for
 * @param policyId - The ID of the policy to fetch values for
 * @returns Array of parameter value records
 */
export async function fetchParameterValues(
  parameterId: string,
  policyId: string
): Promise<V2ParameterValueMetadata[]> {
  const params = new URLSearchParams();
  params.set("parameter_id", parameterId);
  params.set("policy_id", policyId);

  const res = await fetch(
    `${API_V2_BASE_URL}/parameter-values/?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch parameter values for parameter ${parameterId} with policy ${policyId}`
    );
  }

  return res.json();
}
