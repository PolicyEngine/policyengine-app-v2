import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { USCongressionalDistrictBreakdown } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';

/**
 * US State FIPS codes lookup
 * Maps state abbreviations to 2-digit FIPS codes
 */
const STATE_FIPS: Record<string, string> = {
  AL: '01',
  AK: '02',
  AZ: '04',
  AR: '05',
  CA: '06',
  CO: '08',
  CT: '09',
  DE: '10',
  DC: '11',
  FL: '12',
  GA: '13',
  HI: '15',
  ID: '16',
  IL: '17',
  IN: '18',
  IA: '19',
  KS: '20',
  KY: '21',
  LA: '22',
  ME: '23',
  MD: '24',
  MA: '25',
  MI: '26',
  MN: '27',
  MS: '28',
  MO: '29',
  MT: '30',
  NE: '31',
  NV: '32',
  NH: '33',
  NJ: '34',
  NM: '35',
  NY: '36',
  NC: '37',
  ND: '38',
  OH: '39',
  OK: '40',
  OR: '41',
  PA: '42',
  RI: '44',
  SC: '45',
  SD: '46',
  TN: '47',
  TX: '48',
  UT: '49',
  VT: '50',
  VA: '51',
  WA: '53',
  WV: '54',
  WI: '55',
  WY: '56',
  PR: '72',
};

/**
 * State names lookup for display labels
 */
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  PR: 'Puerto Rico',
};

/**
 * States with at-large congressional districts (single district for entire state)
 */
const AT_LARGE_STATES = new Set(['AK', 'DE', 'ND', 'SD', 'VT', 'WY', 'DC']);

/**
 * Converts a district identifier from API format to GeoJSON GEOID format.
 *
 * @param district - District in API format (e.g., "AL-01", "CA-52", "AK-01")
 * @returns GeoJSON GEOID format (e.g., "0101", "0652", "0200")
 *
 * @example
 * ```typescript
 * convertDistrictToGeoId('AL-01')  // returns "0101"
 * convertDistrictToGeoId('CA-52')  // returns "0652"
 * convertDistrictToGeoId('AK-01')  // returns "0200" (at-large uses "00")
 * ```
 */
export function convertDistrictToGeoId(district: string): string {
  const [stateAbbr, districtNum] = district.split('-');
  const stateFips = STATE_FIPS[stateAbbr];

  if (!stateFips) {
    console.warn(`Unknown state abbreviation: ${stateAbbr}`);
    return '0000';
  }

  // At-large districts use "00" as district number in GeoJSON
  // But API sends them as "01", so we need to convert
  if (AT_LARGE_STATES.has(stateAbbr)) {
    return `${stateFips}00`;
  }

  // Pad district number to 2 digits
  const paddedDistrict = districtNum.padStart(2, '0');
  return `${stateFips}${paddedDistrict}`;
}

/**
 * Gets a human-readable label for a congressional district.
 *
 * @param district - District in API format (e.g., "AL-01", "CA-52")
 * @returns Human-readable label (e.g., "Alabama's 1st congressional district")
 *
 * @example
 * ```typescript
 * getDistrictLabel('AL-01')  // "Alabama's 1st congressional district"
 * getDistrictLabel('CA-52')  // "California's 52nd congressional district"
 * getDistrictLabel('AK-01')  // "Alaska's at-large congressional district"
 * ```
 */
export function getDistrictLabel(district: string): string {
  const [stateAbbr, districtNum] = district.split('-');
  const stateName = STATE_NAMES[stateAbbr] || stateAbbr;

  // At-large districts
  if (AT_LARGE_STATES.has(stateAbbr)) {
    return `${stateName}'s at-large congressional district`;
  }

  // Format district number with ordinal suffix
  const num = parseInt(districtNum, 10);
  const ordinal = getOrdinalSuffix(num);

  return `${stateName}'s ${num}${ordinal} congressional district`;
}

/**
 * Gets the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Transform API congressional district data to choropleth map data points.
 *
 * @param apiData - Congressional district breakdown data from API
 * @param valueField - Which field to use as the value
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
 *
 * const points = transformDistrictData(apiData, 'average_household_income_change');
 * // points[0] = { geoId: '0101', label: "Alabama's 1st...", value: 312.45 }
 * ```
 */
export function transformDistrictData(
  apiData: USCongressionalDistrictBreakdown,
  valueField: 'average_household_income_change' | 'relative_household_income_change'
): ChoroplethDataPoint[] {
  return apiData.districts.map((item) => ({
    geoId: convertDistrictToGeoId(item.district),
    label: getDistrictLabel(item.district),
    value: item[valueField],
  }));
}

/**
 * Transform API data for average household income change visualization.
 *
 * @param apiData - Congressional district breakdown data from API
 * @returns Array of ChoroplethDataPoint with average income changes
 */
export function transformDistrictAverageChange(
  apiData: USCongressionalDistrictBreakdown
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'average_household_income_change');
}

/**
 * Transform API data for relative household income change visualization.
 *
 * @param apiData - Congressional district breakdown data from API
 * @returns Array of ChoroplethDataPoint with relative income changes
 */
export function transformDistrictRelativeChange(
  apiData: USCongressionalDistrictBreakdown
): ChoroplethDataPoint[] {
  return transformDistrictData(apiData, 'relative_household_income_change');
}
