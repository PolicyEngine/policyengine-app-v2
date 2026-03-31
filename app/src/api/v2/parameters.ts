import type { V2ParameterMetadata } from '@/types/metadata';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch } from './v2Fetch';

/**
 * Fetch all parameters for a country.
 */
export async function fetchParameters(countryId: string): Promise<V2ParameterMetadata[]> {
  return v2Fetch<V2ParameterMetadata[]>(
    `${API_V2_BASE_URL}/parameters/?country_id=${countryId}&limit=10000`,
    `fetchParameters(${countryId})`
  );
}
