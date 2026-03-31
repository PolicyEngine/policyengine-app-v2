import type { V2DatasetMetadata } from '@/types/metadata';
import { API_V2_BASE_URL } from './taxBenefitModels';

/**
 * Fetch all datasets for a country
 */
export async function fetchDatasets(countryId: string): Promise<V2DatasetMetadata[]> {
  const res = await fetch(`${API_V2_BASE_URL}/datasets/?country_id=${countryId}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch datasets for ${countryId}`);
  }

  return res.json();
}
