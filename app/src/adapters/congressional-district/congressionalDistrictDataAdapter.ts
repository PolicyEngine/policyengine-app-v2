import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { MetadataRegionEntry } from '@/types/metadata';
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { US_REGION_TYPES } from '@/types/regionTypes';

/**
 * Type for district label lookup map (district ID -> label)
 */
export type DistrictLabelLookup = Map<string, string>;

/**
 * Builds a lookup map from district ID to label from metadata regions.
 *
 * @param regions - Array of region entries from metadata.economyOptions.region
 * @returns Map from district ID (e.g., "AL-01") to label (e.g., "Alabama's 1st congressional district")
 *
 * @example
 * ```typescript
 * const labelLookup = buildDistrictLabelLookup(metadata.economyOptions.region);
 * labelLookup.get('AL-01'); // "Alabama's 1st congressional district"
 * ```
 */
export function buildDistrictLabelLookup(regions: MetadataRegionEntry[]): DistrictLabelLookup {
  const lookup = new Map<string, string>();

  for (const region of regions) {
    if (region.type === US_REGION_TYPES.CONGRESSIONAL_DISTRICT) {
      lookup.set(region.name, region.label);
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
 * Labels are sourced from API metadata to avoid duplicating state name mappings
 * and ordinal formatting logic.
 *
 * @param apiData - Congressional district breakdown data from API
 * @param valueField - Which field to use as the value
 * @param labelLookup - Map from district ID to human-readable label (from metadata)
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
 * const labelLookup = buildDistrictLabelLookup(metadata.economyOptions.region);
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
  return apiData.districts.map((item) => ({
    geoId: item.district, // Use district ID directly (matches GeoJSON DISTRICT_ID)
    label: labelLookup.get(item.district) ?? `District ${item.district}`,
    value: item[valueField],
  }));
}

/**
 * Transform API data for average household income change visualization.
 *
 * @param apiData - Congressional district breakdown data from API
 * @param labelLookup - Map from district ID to human-readable label (from metadata)
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
 * @param labelLookup - Map from district ID to human-readable label (from metadata)
 * @returns Array of ChoroplethDataPoint with relative income changes
 */
export function transformDistrictRelativeChange(
  apiData: USCongressionalDistrictBreakdown,
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'relative_household_income_change', labelLookup);
}
