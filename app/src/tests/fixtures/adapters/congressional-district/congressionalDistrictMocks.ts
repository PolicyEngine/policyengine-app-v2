import type { CongressionalDistrictData } from '@/api/v2/economyAnalysis';
import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';
import type { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';

const REPORT_ID = 'test-report-001';

/**
 * Mock congressional district data matching the v2 API response structure
 */
export const MOCK_DISTRICT_DATA: CongressionalDistrictData[] = [
  {
    id: 'cd-1',
    report_id: REPORT_ID,
    district_geoid: 101,
    state_fips: 1,
    district_number: 1,
    average_household_income_change: 312.45,
    relative_household_income_change: 0.0187,
    population: 750000,
  },
  {
    id: 'cd-2',
    report_id: REPORT_ID,
    district_geoid: 652,
    state_fips: 6,
    district_number: 52,
    average_household_income_change: 612.88,
    relative_household_income_change: 0.041,
    population: 760000,
  },
  {
    id: 'cd-3',
    report_id: REPORT_ID,
    district_geoid: 3612,
    state_fips: 36,
    district_number: 12,
    average_household_income_change: -234.56,
    relative_household_income_change: -0.012,
    population: 770000,
  },
  {
    id: 'cd-4',
    report_id: REPORT_ID,
    district_geoid: 4828,
    state_fips: 48,
    district_number: 28,
    average_household_income_change: 0,
    relative_household_income_change: 0,
    population: 740000,
  },
];

/**
 * Mock metadata regions containing congressional districts and other region types
 */
export const MOCK_REGIONS: MetadataRegionEntry[] = [
  {
    name: 'us',
    label: 'United States',
    type: US_REGION_TYPES.NATIONAL,
  },
  {
    name: 'CA',
    label: 'California',
    type: US_REGION_TYPES.STATE,
  },
  {
    name: 'AL-01',
    label: "Alabama's 1st congressional district",
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
    name: 'NY-12',
    label: "New York's 12th congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'NY',
    state_name: 'New York',
  },
  {
    name: 'TX-28',
    label: "Texas's 28th congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'TX',
    state_name: 'Texas',
  },
  {
    name: 'NYC',
    label: 'New York City',
    type: US_REGION_TYPES.CITY,
  },
];

/**
 * Mock regions with non-US types mixed in (for filtering tests)
 */
export const MOCK_MIXED_REGIONS: MetadataRegionEntry[] = [
  ...MOCK_REGIONS,
  {
    name: 'uk',
    label: 'United Kingdom',
    type: UK_REGION_TYPES.NATIONAL,
  },
  {
    name: 'Westminster North',
    label: 'Westminster North',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
];

/**
 * Expected output after transforming average change data
 */
export const EXPECTED_ABSOLUTE_CHANGE_DATA: ChoroplethDataPoint[] = [
  { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 312.45 },
  { geoId: 'CA-52', label: "California's 52nd congressional district", value: 612.88 },
  { geoId: 'NY-12', label: "New York's 12th congressional district", value: -234.56 },
  { geoId: 'TX-28', label: "Texas's 28th congressional district", value: 0 },
];

/**
 * Expected output after transforming relative change data
 */
export const EXPECTED_RELATIVE_CHANGE_DATA: ChoroplethDataPoint[] = [
  { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 0.0187 },
  { geoId: 'CA-52', label: "California's 52nd congressional district", value: 0.041 },
  { geoId: 'NY-12', label: "New York's 12th congressional district", value: -0.012 },
  { geoId: 'TX-28', label: "Texas's 28th congressional district", value: 0 },
];

/**
 * Single district for edge case testing
 */
export const SINGLE_DISTRICT_DATA: CongressionalDistrictData[] = [
  {
    id: 'cd-single',
    report_id: REPORT_ID,
    district_geoid: 5601,
    state_fips: 56,
    district_number: 1,
    average_household_income_change: 500.0,
    relative_household_income_change: 0.03,
    population: 580000,
  },
];

/**
 * Empty district data for edge case testing
 */
export const EMPTY_DISTRICT_DATA: CongressionalDistrictData[] = [];

/**
 * District data with a district not in metadata (for fallback label testing)
 */
export const DISTRICT_DATA_WITH_UNKNOWN: CongressionalDistrictData[] = [
  {
    id: 'cd-known',
    report_id: REPORT_ID,
    district_geoid: 101,
    state_fips: 1,
    district_number: 1,
    average_household_income_change: 100.0,
    relative_household_income_change: 0.01,
    population: 750000,
  },
  {
    id: 'cd-unknown',
    report_id: REPORT_ID,
    district_geoid: 9999,
    state_fips: 99,
    district_number: 99,
    average_household_income_change: 200.0,
    relative_household_income_change: 0.02,
    population: 600000,
  },
];
