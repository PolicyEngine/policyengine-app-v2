import { API_V2_BASE_URL, getModelName } from './taxBenefitModels';

/**
 * V2 API Region response type
 * Matches the RegionRead schema from the API
 */
export interface V2RegionMetadata {
  id: string;
  code: string; // e.g., "state/ca", "constituency/Sheffield Central"
  label: string; // e.g., "California", "Sheffield Central"
  region_type: string; // e.g., "state", "congressional_district", "constituency"
  requires_filter: boolean;
  filter_field: string | null; // e.g., "state_code", "place_fips"
  filter_value: string | null; // e.g., "CA", "44000"
  parent_code: string | null; // e.g., "us", "state/ca"
  state_code: string | null; // For US regions
  state_name: string | null; // For US regions
  dataset_id: string;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all regions for a country
 *
 * @param countryId - Country ID (e.g., 'us', 'uk')
 * @param regionType - Optional region type filter (e.g., 'state', 'congressional_district')
 */
export async function fetchRegions(
  countryId: string,
  regionType?: string
): Promise<V2RegionMetadata[]> {
  const modelName = getModelName(countryId);
  let url = `${API_V2_BASE_URL}/regions/?tax_benefit_model_name=${modelName}`;

  if (regionType) {
    url += `&region_type=${encodeURIComponent(regionType)}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch regions for ${countryId}`);
  }

  return res.json();
}

/**
 * Fetch a specific region by code
 *
 * @param countryId - Country ID (e.g., 'us', 'uk')
 * @param regionCode - Region code (e.g., 'state/ca', 'us')
 */
export async function fetchRegionByCode(
  countryId: string,
  regionCode: string
): Promise<V2RegionMetadata> {
  const modelName = getModelName(countryId);
  const url = `${API_V2_BASE_URL}/regions/by-code/${encodeURIComponent(regionCode)}?tax_benefit_model_name=${modelName}`;

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Region not found: ${regionCode}`);
    }
    throw new Error(`Failed to fetch region ${regionCode} for ${countryId}`);
  }

  return res.json();
}
