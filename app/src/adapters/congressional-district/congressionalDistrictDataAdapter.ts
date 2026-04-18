import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { RegionRecord } from '@/models/region';
import type { MetadataRegionEntry } from '@/types/metadata';
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { US_REGION_TYPES } from '@/types/regionTypes';

type DistrictRegionSource = MetadataRegionEntry | RegionRecord;

function isV2RegionRecord(region: DistrictRegionSource): region is RegionRecord {
  return 'regionType' in region && 'code' in region;
}

function isV1MetadataRegionEntry(region: DistrictRegionSource): region is MetadataRegionEntry {
  return 'type' in region && 'name' in region;
}

function getDistrictRegionType(region: DistrictRegionSource): string {
  if (isV2RegionRecord(region)) {
    return region.regionType;
  }

  if (isV1MetadataRegionEntry(region)) {
    return region.type;
  }

  return '';
}

function getDistrictRegionCode(region: DistrictRegionSource): string {
  if (isV2RegionRecord(region)) {
    return region.code;
  }

  if (isV1MetadataRegionEntry(region)) {
    return region.name;
  }

  return '';
}

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
 * Builds a lookup map from district ID to label from canonical region records or legacy metadata.
 *
 * @param regions - Array of canonical region records or legacy metadata entries
 * @returns Map from district ID (e.g., "AL-01") to label (e.g., "Alabama's 1st congressional district")
 *
 * @example
 * ```typescript
 * const labelLookup = buildDistrictLabelLookup(regions);
 * labelLookup.get('AL-01'); // "Alabama's 1st congressional district"
 * ```
 */
export function buildDistrictLabelLookup(regions: DistrictRegionSource[]): DistrictLabelLookup {
  const lookup = new Map<string, string>();

  for (const region of regions) {
    const regionType = getDistrictRegionType(region);
    const regionCode = getDistrictRegionCode(region);

    if (regionType === US_REGION_TYPES.CONGRESSIONAL_DISTRICT) {
      // Strip "congressional_district/" prefix so keys match API district IDs (e.g., "AL-01")
      const key = regionCode.replace(/^congressional_district\//, '');
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
 * Labels are sourced from region metadata to avoid duplicating state name mappings
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
