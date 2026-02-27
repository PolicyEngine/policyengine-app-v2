import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { MOCK_DISTRICT_DATA } from '@/tests/fixtures/adapters/congressional-district/congressionalDistrictMocks';
import { createMockEconomicImpactResponse } from '@/tests/fixtures/v2MockFactory';
import type { MetadataRegionEntry, MetadataState } from '@/types/metadata';
import { US_REGION_TYPES } from '@/types/regionTypes';

// Test constants
export const TEST_COUNTRY_US = 'us';
export const TEST_CURRENT_YEAR = 2025;

/**
 * Mock US congressional district region entries for metadata
 */
export const MOCK_CONGRESSIONAL_DISTRICT_REGIONS: MetadataRegionEntry[] = [
  {
    name: 'us',
    label: 'United States',
    type: US_REGION_TYPES.NATIONAL,
  },
  {
    name: 'AL-01',
    label: "Alabama's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'AL',
    state_name: 'Alabama',
  },
  {
    name: 'AL-02',
    label: "Alabama's 2nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'AL',
    state_name: 'Alabama',
  },
  {
    name: 'CA-52',
    label: "California's 52nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'CA',
    state_name: 'California',
  },
  {
    name: 'NY-14',
    label: "New York's 14th congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'NY',
    state_name: 'New York',
  },
  {
    name: 'TX-35',
    label: "Texas's 35th congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'TX',
    state_name: 'Texas',
  },
];

/**
 * Mock US economic impact response with congressional district impact data.
 * Uses v2 EconomicImpactResponse with CongressionalDistrictData[].
 */
export const MOCK_US_REPORT_OUTPUT: EconomicImpactResponse = createMockEconomicImpactResponse({
  congressional_district_impact: MOCK_DISTRICT_DATA,
});

/**
 * Mock US economic impact response with no congressional district data (null)
 */
export const MOCK_US_REPORT_OUTPUT_NO_DISTRICT: EconomicImpactResponse =
  createMockEconomicImpactResponse({
    congressional_district_impact: null,
  });

/**
 * Mock metadata state matching the new MetadataState structure.
 * Note: Regions are now accessed via static metadata hooks (useRegionsList),
 * not from Redux state. This mock only contains API-driven data.
 */
export const MOCK_METADATA_WITH_REGIONS: MetadataState = {
  currentCountry: 'us',
  loading: false,
  loaded: true,
  error: null,
  progress: 100,
  variables: {},
  parameters: {},
  datasets: [
    {
      name: 'cps_2023',
      label: 'CPS 2023',
      title: 'Current Population Survey 2023',
      default: true,
    },
  ],
  version: '1.0.0',
};
