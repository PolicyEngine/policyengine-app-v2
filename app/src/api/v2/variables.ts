import type { V2VariableMetadata } from '@/types/metadata';
import { API_V2_BASE_URL } from './taxBenefitModels';

/**
 * Fetch all variables for a country.
 */
export async function fetchVariables(countryId: string): Promise<V2VariableMetadata[]> {
  const res = await fetch(`${API_V2_BASE_URL}/variables/?country_id=${countryId}&limit=10000`);

  if (!res.ok) {
    throw new Error(`Failed to fetch variables for ${countryId}`);
  }

  return res.json();
}
