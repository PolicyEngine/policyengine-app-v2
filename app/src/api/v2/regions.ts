import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch } from './v2Fetch';

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
  let url = `${API_V2_BASE_URL}/regions/?country_id=${countryId}`;

  if (regionType) {
    url += `&region_type=${encodeURIComponent(regionType)}`;
  }

  return v2Fetch<V2RegionMetadata[]>(url, `fetchRegions(${countryId})`);
}

/**
 * Fetch a specific region by code.
 *
 * Uses manual fetch because 404 must throw a domain-specific message
 * ("Region not found: ...") rather than the generic v2Fetch error.
 *
 * @param countryId - Country ID (e.g., 'us', 'uk')
 * @param regionCode - Region code (e.g., 'state/ca', 'us')
 */
export async function fetchRegionByCode(
  countryId: string,
  regionCode: string
): Promise<V2RegionMetadata> {
  const url = `${API_V2_BASE_URL}/regions/by-code/${encodeURIComponent(regionCode)}?country_id=${countryId}`;

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Region not found: ${regionCode}`);
    }
    const errorText = await res.text().catch(() => '');
    throw new Error(
      `Failed to fetch region ${regionCode} for ${countryId}: ${res.status} ${errorText}`
    );
  }

  return res.json();
}
