import type { V2ParameterMetadata } from '@/types/metadata';
import { API_V2_BASE_URL, getModelName } from './taxBenefitModels';

/**
 * Fetch all parameters for a country.
 */
export async function fetchParameters(countryId: string): Promise<V2ParameterMetadata[]> {
  const modelName = getModelName(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/parameters/?tax_benefit_model_name=${modelName}&limit=10000`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch parameters for ${countryId}`);
  }

  return res.json();
}
