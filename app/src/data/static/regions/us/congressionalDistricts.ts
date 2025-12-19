/**
 * US Congressional Districts (2020 Census Apportionment)
 *
 * 436 districts total (435 voting + DC non-voting delegate)
 * Effective for 118th Congress (2023-2025) through at least 119th Congress (2025-2027)
 *
 * Source: https://ballotpedia.org/Congressional_apportionment_after_the_2020_census
 */

import { MetadataRegionEntry } from '@/types/metadata';
import { US_REGION_TYPES } from '@/types/regionTypes';
import { RegionVersionMeta, VersionedRegionSet } from '../types';

// State code to full name mapping
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
};

// States with only one at-large district
const AT_LARGE_STATES = new Set(['AK', 'DE', 'DC', 'ND', 'SD', 'VT', 'WY']);

// District counts by state (2020 Census apportionment)
// Format: [stateCode, districtCount]
const DISTRICT_COUNTS_2020: [string, number][] = [
  ['AL', 7],
  ['AK', 1],
  ['AZ', 9],
  ['AR', 4],
  ['CA', 52],
  ['CO', 8],
  ['CT', 5],
  ['DE', 1],
  ['DC', 1],
  ['FL', 28],
  ['GA', 14],
  ['HI', 2],
  ['ID', 2],
  ['IL', 17],
  ['IN', 9],
  ['IA', 4],
  ['KS', 4],
  ['KY', 6],
  ['LA', 6],
  ['ME', 2],
  ['MD', 8],
  ['MA', 9],
  ['MI', 13],
  ['MN', 8],
  ['MS', 4],
  ['MO', 8],
  ['MT', 2],
  ['NE', 3],
  ['NV', 4],
  ['NH', 2],
  ['NJ', 12],
  ['NM', 3],
  ['NY', 26],
  ['NC', 14],
  ['ND', 1],
  ['OH', 15],
  ['OK', 5],
  ['OR', 6],
  ['PA', 17],
  ['RI', 2],
  ['SC', 7],
  ['SD', 1],
  ['TN', 9],
  ['TX', 38],
  ['UT', 4],
  ['VT', 1],
  ['VA', 11],
  ['WA', 10],
  ['WV', 2],
  ['WI', 8],
  ['WY', 1],
];

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Build district label (e.g., "California's 1st congressional district")
 */
function buildDistrictLabel(stateCode: string, districtNumber: number): string {
  const stateName = STATE_NAMES[stateCode];
  if (AT_LARGE_STATES.has(stateCode)) {
    return `${stateName}'s at-large congressional district`;
  }
  return `${stateName}'s ${districtNumber}${getOrdinalSuffix(districtNumber)} congressional district`;
}

/**
 * Generate all congressional district entries from compact data
 */
function buildCongressionalDistricts(
  districtCounts: [string, number][]
): MetadataRegionEntry[] {
  const districts: MetadataRegionEntry[] = [];

  for (const [stateCode, count] of districtCounts) {
    for (let i = 1; i <= count; i++) {
      const districtNum = i.toString().padStart(2, '0');
      districts.push({
        name: `congressional_district/${stateCode}-${districtNum}`,
        label: buildDistrictLabel(stateCode, i),
        type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
        state_abbreviation: stateCode,
        state_name: STATE_NAMES[stateCode],
      });
    }
  }

  return districts;
}

const VERSION_2020_CENSUS: RegionVersionMeta = {
  version: '2020-census',
  effectiveFrom: 2023,
  effectiveUntil: null,
  description:
    'Districts based on 2020 Census apportionment (118th-119th Congress)',
  source:
    'https://ballotpedia.org/Congressional_apportionment_after_the_2020_census',
};

// Generate districts once at module load
const DISTRICTS_2020_CENSUS = buildCongressionalDistricts(DISTRICT_COUNTS_2020);

export const US_CONGRESSIONAL_DISTRICTS: VersionedRegionSet = {
  versions: {
    '2020-census': {
      meta: VERSION_2020_CENSUS,
      data: DISTRICTS_2020_CENSUS,
    },
  },
  getVersionForYear: (_year: number): string => {
    // 2020 Census districts effective from 2023 onwards
    // For years before 2023, still return 2020-census as fallback
    return '2020-census';
  },
};
