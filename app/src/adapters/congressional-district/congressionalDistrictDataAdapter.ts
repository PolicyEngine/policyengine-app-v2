import type { CongressionalDistrictData } from '@/api/v2/economyAnalysis';
import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { MetadataRegionEntry } from '@/types/metadata';
import { US_REGION_TYPES } from '@/types/regionTypes';

export type DistrictLabelLookup = Map<string, string>;

// State FIPS to abbreviation lookup
const STATE_FIPS_TO_ABBREV: Record<number, string> = {
  1: 'AL',
  2: 'AK',
  4: 'AZ',
  5: 'AR',
  6: 'CA',
  8: 'CO',
  9: 'CT',
  10: 'DE',
  11: 'DC',
  12: 'FL',
  13: 'GA',
  15: 'HI',
  16: 'ID',
  17: 'IL',
  18: 'IN',
  19: 'IA',
  20: 'KS',
  21: 'KY',
  22: 'LA',
  23: 'ME',
  24: 'MD',
  25: 'MA',
  26: 'MI',
  27: 'MN',
  28: 'MS',
  29: 'MO',
  30: 'MT',
  31: 'NE',
  32: 'NV',
  33: 'NH',
  34: 'NJ',
  35: 'NM',
  36: 'NY',
  37: 'NC',
  38: 'ND',
  39: 'OH',
  40: 'OK',
  41: 'OR',
  42: 'PA',
  44: 'RI',
  45: 'SC',
  46: 'SD',
  47: 'TN',
  48: 'TX',
  49: 'UT',
  50: 'VT',
  51: 'VA',
  53: 'WA',
  54: 'WV',
  55: 'WI',
  56: 'WY',
};

function formatDistrictId(item: CongressionalDistrictData): string {
  const stateAbbrev = STATE_FIPS_TO_ABBREV[item.state_fips] ?? `${item.state_fips}`;
  const districtNum = item.district_number.toString().padStart(2, '0');
  return `${stateAbbrev}-${districtNum}`;
}

export function buildDistrictLabelLookup(regions: MetadataRegionEntry[]): DistrictLabelLookup {
  const lookup = new Map<string, string>();
  for (const region of regions) {
    if (region.type === US_REGION_TYPES.CONGRESSIONAL_DISTRICT) {
      lookup.set(region.name, region.label);
    }
  }
  return lookup;
}

export function transformDistrictData(
  apiData: CongressionalDistrictData[],
  valueField: 'average_household_income_change' | 'relative_household_income_change',
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return apiData.map((item) => {
    const districtId = formatDistrictId(item);
    return {
      geoId: districtId,
      label: labelLookup.get(districtId) ?? `District ${districtId}`,
      value: item[valueField] ?? 0,
    };
  });
}

export function transformDistrictAbsoluteChange(
  apiData: CongressionalDistrictData[],
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'average_household_income_change', labelLookup);
}

export function transformDistrictRelativeChange(
  apiData: CongressionalDistrictData[],
  labelLookup: DistrictLabelLookup
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'relative_household_income_change', labelLookup);
}
