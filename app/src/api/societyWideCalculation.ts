import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

// ============================================================================
// US Dataset URL Utilities
// ============================================================================

/**
 * Prefix used to identify US congressional district regions in metadata.
 * Example: "district/CA-01", "district/NY-12"
 */
export const US_DISTRICT_PREFIX = 'district/';

/**
 * Base URL for US datasets on HuggingFace.
 */
const US_DATASET_BASE_URL = 'hf://policyengine/policyengine-us-data';

/**
 * Checks if a region code represents a US congressional district.
 *
 * @param region - The region code (e.g., "district/CA-01", "ca", "us")
 * @returns true if the region is a congressional district
 */
export function isUSCongressionalDistrict(region: string | undefined): boolean {
  if (!region) {
    return false;
  }
  return region.startsWith(US_DISTRICT_PREFIX);
}

/**
 * Generates the HuggingFace URL for a district-specific dataset.
 *
 * @param districtRegion - The full region value (e.g., "district/CA-01")
 * @returns The HuggingFace URL for the district dataset
 *
 * @example
 * getDistrictDatasetUrl("district/CA-01") // "hf://policyengine/policyengine-us-data/districts/CA-01.h5"
 */
export function getDistrictDatasetUrl(districtRegion: string): string {
  const districtCode = districtRegion.replace(US_DISTRICT_PREFIX, '');
  return `${US_DATASET_BASE_URL}/districts/${districtCode}.h5`;
}

// ============================================================================
// Dataset Selection
// ============================================================================

/**
 * Determines the dataset to use for a society-wide calculation.
 *
 * Dataset selection logic:
 * - US nationwide ('us'): Returns 'enhanced_cps'
 * - US congressional district ('district/XX-##'): Returns HuggingFace URL for district dataset
 * - All other cases (UK, US states, etc.): Returns undefined to use API default
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param region - The region (e.g., 'us', 'ca', 'district/CA-01', 'uk')
 * @returns The dataset name/URL or undefined to use API default
 */
export function getDatasetForRegion(countryId: string, region: string): string | undefined {
  // Only process US regions
  if (countryId !== 'us') {
    return undefined;
  }

  // US nationwide uses enhanced CPS
  if (region === 'us') {
    return 'enhanced_cps';
  }

  // US congressional district uses district-specific dataset
  if (isUSCongressionalDistrict(region)) {
    return getDistrictDatasetUrl(region);
  }

  // US states and other regions use API default
  return undefined;
}

// NOTE: Need to add other params at later point
export interface SocietyWideCalculationParams {
  region: string; // "us" for nationwide, state code (e.g., "ca"), or district (e.g., "district/CA-01")
  time_period: string; // Four-digit year
  dataset?: string; // Optional dataset parameter; defaults to API's default dataset
}

export interface SocietyWideCalculationResponse {
  status: 'computing' | 'ok' | 'error';
  queue_position?: number;
  average_time?: number;
  result: SocietyWideReportOutput | null;
  error?: string;
}

export async function fetchSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<SocietyWideCalculationResponse> {
  console.log('[fetchSocietyWideCalculation] Called with:');
  console.log('  - countryId:', countryId);
  console.log('  - reformPolicyId:', reformPolicyId);
  console.log('  - baselinePolicyId:', baselinePolicyId);
  console.log('  - params:', JSON.stringify(params, null, 2));

  // Automatically set dataset for US nationwide if not explicitly provided
  const dataset = params.dataset ?? getDatasetForRegion(countryId, params.region);
  const paramsWithDataset = dataset ? { ...params, dataset } : params;

  const queryParams = new URLSearchParams();

  Object.entries(paramsWithDataset).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;
  console.log('[fetchSocietyWideCalculation] Fetching URL:', url);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(
    '[fetchSocietyWideCalculation] Response status:',
    response.status,
    response.statusText
  );

  if (!response.ok) {
    console.error(
      '[fetchSocietyWideCalculation] Failed with status:',
      response.status,
      response.statusText
    );
    throw new Error(`Society-wide calculation failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[fetchSocietyWideCalculation] Response data:');
  console.log('  - status:', data.status);
  console.log('  - has result?', !!data.result);
  console.log('  - queue_position:', data.queue_position);
  console.log('  - average_time:', data.average_time);
  console.log('  - error:', data.error);
  console.log('  - full response:', JSON.stringify(data, null, 2));

  return data;
}
