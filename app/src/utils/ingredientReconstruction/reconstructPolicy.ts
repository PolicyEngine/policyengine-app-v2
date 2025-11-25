import { PolicyStateProps } from '@/types/pathwayState';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Reconstructs a PolicyStateProps object from policy_json format
 * Used when loading existing policies in pathways
 *
 * @param policyId - The policy ID
 * @param label - The policy label (from user association or policy metadata)
 * @param policyJson - The policy_json object with parameter definitions
 * @returns A fully-formed PolicyStateProps object
 */
export function reconstructPolicyFromJson(
  policyId: string,
  label: string | null,
  policyJson: Record<string, any>
): PolicyStateProps {
  const parameters: Parameter[] = [];

  // Convert policy_json to Parameter[] format
  Object.entries(policyJson).forEach(([paramName, valueIntervals]) => {
    if (Array.isArray(valueIntervals) && valueIntervals.length > 0) {
      const values = valueIntervals.map((vi: any) => ({
        startDate: vi.start || vi.startDate,
        endDate: vi.end || vi.endDate,
        value: vi.value,
      }));
      parameters.push({ name: paramName, values });
    }
  });

  return {
    id: policyId,
    label,
    parameters,
  };
}

/**
 * Reconstructs a PolicyStateProps object from a Policy ingredient
 * Used when loading existing policies that are already in Parameter[] format
 *
 * @param policyId - The policy ID
 * @param label - The policy label
 * @param parameters - The parameters array
 * @returns A fully-formed PolicyStateProps object
 */
export function reconstructPolicyFromParameters(
  policyId: string,
  label: string | null,
  parameters: Parameter[]
): PolicyStateProps {
  return {
    id: policyId,
    label,
    parameters,
  };
}
