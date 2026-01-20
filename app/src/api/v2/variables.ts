import type { V2VariableMetadata } from '@/types/metadata';
import { API_V2_BASE_URL, getModelName } from './taxBenefitModels';

/**
 * Fetch all variables for a country.
 */
export async function fetchVariables(countryId: string): Promise<V2VariableMetadata[]> {
  const modelName = getModelName(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/variables/?tax_benefit_model_name=${modelName}&limit=10000`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch variables for ${countryId}`);
  }

  return res.json();
}
