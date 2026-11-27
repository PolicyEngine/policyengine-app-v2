import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { Region } from '@/models/region';
import type {
  USCongressionalDistrictBreakdown,
  USCongressionalDistrictBreakdownItem,
} from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { US_REGION_TYPES } from '@/types/regionTypes';

/**
 * Type for district label lookup map (district ID -> label)
 */
export type DistrictLabelLookup = Map<string, string>;

/**
 * Normalizes district IDs to match the canonical format used by metadata and GeoJSON.
 *
 * WORKAROUND: The backend dataset encodes single-district states as -00 instead of
 * -01, and DC as -98 instead of -01. This function corrects those IDs so they match
 * the metadata and GeoJSON. Remove this workaround once the dataset is fixed upstream.
 */
export function normalizeDistrictId(districtId: string): string {
  const [state, num] = districtId.split('-');
  if (num === '00') {
    return `${state}-01`;
  }
  if (state === 'DC' && num === '98') {
    return 'DC-01';
  }
  return districtId;
}

/**
 * A result's congressional districts, with their IDs normalised; null when
 * the result has none (a UK result, or one whose districts are null).
 */
export function districtsOf(
  output: SocietyWideReportOutput | null | undefined
): USCongressionalDistrictBreakdownItem[] | null {
  if (!output || !('congressional_district_impact' in output)) {
    return null;
  }
  const districts = output.congressional_district_impact?.districts;
  if (!districts) {
    return null;
  }
  return districts.map((district) => ({
    ...district,
    district: normalizeDistrictId(district.district),
  }));
}

/** Each state's districts as one list, skipping states with none yet. */
export function mergeStateDistricts(
  stateDistricts: Array<USCongressionalDistrictBreakdownItem[] | null | undefined>
): USCongressionalDistrictBreakdownItem[] {
  return stateDistricts.flatMap((districts) => districts ?? []);
}

/**
 * Which states a nationwide report's districts are still waiting for, and
 * which failed, when the districts come from each state's own run.
 * States are named as the API names them (`state/ca`) or by abbreviation.
 */
export interface DistrictCoverage {
  pendingStates?: string[];
  failedStates?: string[];
}

export interface DistrictErrorSummary {
  /** Expected districts with no data, to say how many are missing. */
  errorDistrictCount: number;
  /** The states to mark on the map as having missing data, by abbreviation (`CA`). */
  errorStateAbbrs: string[];
}

/** A state's abbreviation, from `state/ca` or `ca`. */
function stateAbbreviation(state: string): string {
  return state.replace(/^state\//i, '').toUpperCase();
}

/**
 * The districts the region metadata expects (`expectedDistrictIds`) that
 * the saved districts lack, and their states. Without coverage, every one
 * missing counts, as a single result's districts are all there or not.
 * With coverage, a state still pending is neither counted nor marked, and
 * a failed state is marked even when the metadata lists none of its
 * districts. No saved districts at all is nothing missing yet.
 */
export function districtErrorSummary(
  saved: Array<Pick<USCongressionalDistrictBreakdownItem, 'district'>> | null,
  expectedDistrictIds: string[],
  coverage?: DistrictCoverage
): DistrictErrorSummary {
  if (!saved) {
    return { errorDistrictCount: 0, errorStateAbbrs: [] };
  }
  const savedIds = new Set(saved.map((district) => district.district));
  const pending = new Set((coverage?.pendingStates ?? []).map(stateAbbreviation));
  const missingStates = new Set<string>();
  let errorDistrictCount = 0;
  for (const districtId of expectedDistrictIds) {
    const state = districtId.split('-')[0];
    if (savedIds.has(districtId) || pending.has(state)) {
      continue;
    }
    errorDistrictCount += 1;
    missingStates.add(state);
  }
  for (const state of coverage?.failedStates ?? []) {
    missingStates.add(stateAbbreviation(state));
  }
  return { errorDistrictCount, errorStateAbbrs: Array.from(missingStates) };
}

/**
 * Builds a lookup map from district ID to label from canonical region records.
 *
 * @param regions - Array of canonical region records
 * @returns Map from district ID (e.g., "AL-01") to label (e.g., "Alabama's 1st congressional district")
 *
 * @example
 * ```typescript
 * const labelLookup = buildDistrictLabelLookup(regions);
 * labelLookup.get('AL-01'); // "Alabama's 1st congressional district"
 * ```
 */
export function buildDistrictLabelLookup(regions: Region[]): DistrictLabelLookup {
  const lookup = new Map<string, string>();

  for (const region of regions) {
    if (region.regionType === US_REGION_TYPES.CONGRESSIONAL_DISTRICT) {
      // Strip "congressional_district/" prefix so keys match API district IDs (e.g., "AL-01")
      const key = region.code.replace(/^congressional_district\//, '');
      lookup.set(key, region.label);
    }
  }

  return lookup;
}

/**
 * Transform API congressional district data to choropleth map data points.
 *
 * The district ID from the API (e.g., "AL-01") is used directly to match
 * the DISTRICT_ID property in the GeoJSON file. This avoids runtime FIPS
 * code conversion - the GeoJSON was pre-processed to include DISTRICT_ID.
 *
 * Labels are sourced from canonical region data to avoid duplicating state name mappings
 * and ordinal formatting logic.
 *
 * @param apiData - Congressional district breakdown data from API
 * @param valueField - Which field to use as the value
 * @param labelLookup - Map from district ID to human-readable label (from region metadata)
 * @returns Array of ChoroplethDataPoint ready for visualization
 *
 * @example
 * ```typescript
 * const apiData = {
 *   districts: [
 *     { district: 'AL-01', average_household_income_change: 312.45, relative_household_income_change: 0.0187 },
 *     { district: 'CA-52', average_household_income_change: 612.88, relative_household_income_change: 0.041 },
 *   ]
 * };
 * const labelLookup = buildDistrictLabelLookup(regions);
 *
 * const points = transformDistrictData(apiData, 'average_household_income_change', labelLookup);
 * // points[0] = { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 312.45 }
 * ```
 */
export function transformDistrictData(
  apiData: USCongressionalDistrictBreakdown,
  valueField: 'average_household_income_change' | 'relative_household_income_change',
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return apiData.districts.map((item) => {
    const id = normalizeDistrictId(item.district);
    return {
      geoId: id,
      label: labelLookup.get(id) ?? `District ${id}`,
      value: item[valueField],
    };
  });
}

/**
 * Transform API data for average household income change visualization.
 *
 * @param apiData - Congressional district breakdown data from API
 * @param labelLookup - Map from district ID to human-readable label (from region data)
 * @returns Array of ChoroplethDataPoint with average income changes
 */
export function transformDistrictAbsoluteChange(
  apiData: USCongressionalDistrictBreakdown,
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'average_household_income_change', labelLookup);
}

/**
 * Transform API data for relative household income change visualization.
 *
 * @param apiData - Congressional district breakdown data from API
 * @param labelLookup - Map from district ID to human-readable label (from region data)
 * @returns Array of ChoroplethDataPoint with relative income changes
 */
export function transformDistrictRelativeChange(
  apiData: USCongressionalDistrictBreakdown,
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'relative_household_income_change', labelLookup);
}
