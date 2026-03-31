import type { V2DatasetMetadata } from '@/types/metadata';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch } from './v2Fetch';

/**
 * Fetch all datasets for a country
 */
export async function fetchDatasets(countryId: string): Promise<V2DatasetMetadata[]> {
  return v2Fetch<V2DatasetMetadata[]>(
    `${API_V2_BASE_URL}/datasets/?country_id=${countryId}`,
    `fetchDatasets(${countryId})`
  );
}
