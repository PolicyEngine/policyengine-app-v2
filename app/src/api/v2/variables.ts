import type { V2VariableMetadata } from '@/types/metadata';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch } from './v2Fetch';

/**
 * Fetch all variables for a country.
 */
export async function fetchVariables(countryId: string): Promise<V2VariableMetadata[]> {
  return v2Fetch<V2VariableMetadata[]>(
    `${API_V2_BASE_URL}/variables/?country_id=${countryId}&limit=10000`,
    `fetchVariables(${countryId})`
  );
}
