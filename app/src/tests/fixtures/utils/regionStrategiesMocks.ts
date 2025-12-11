import { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';

// Test region values
export const TEST_REGIONS = {
  UK_CONSTITUENCY_PREFIXED: 'constituency/Sheffield Central',
  UK_CONSTITUENCY_DISPLAY: 'Sheffield Central',
  UK_COUNTRY_PREFIXED: 'country/england',
  UK_COUNTRY_DISPLAY: 'england',
  US_STATE: 'state/ca',
  US_STATE_NY: 'state/ny',
  US_CONGRESSIONAL_DISTRICT: 'congressional_district/CA-01',
  UK_NATIONAL: 'uk',
  US_NATIONAL: 'us',
  // Legacy US region formats (without prefix)
  US_LEGACY_STATE_CODE: 'tx',
  US_LEGACY_CITY_CODE_NYC: 'nyc',
  US_LEGACY_STATE_CODE_CA: 'ca',
} as const;

// Mock metadata regions for UK
export const mockUKRegions: MetadataRegionEntry[] = [
  { name: 'uk', label: 'the UK', type: UK_REGION_TYPES.NATIONAL },
  { name: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/ni', label: 'Northern Ireland', type: UK_REGION_TYPES.COUNTRY },
  {
    name: 'constituency/Sheffield Central',
    label: 'Sheffield Central',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
  {
    name: 'constituency/Manchester Central',
    label: 'Manchester Central',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
  {
    name: 'constituency/Brighton Pavilion',
    label: 'Brighton Pavilion',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
];

// Mock metadata regions for US
export const mockUSRegions: MetadataRegionEntry[] = [
  { name: 'us', label: 'the US', type: US_REGION_TYPES.NATIONAL },
  { name: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
  { name: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
  { name: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
  { name: 'state/fl', label: 'Florida', type: US_REGION_TYPES.STATE },
  {
    name: 'congressional_district/CA-01',
    label: "California's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'CA',
    state_name: 'California',
  },
  {
    name: 'congressional_district/CA-02',
    label: "California's 2nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'CA',
    state_name: 'California',
  },
  {
    name: 'congressional_district/NY-01',
    label: "New York's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'NY',
    state_name: 'New York',
  },
];

// Expected region options after filtering
export const expectedUSStates = [
  { value: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
  { value: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
  { value: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
  { value: 'state/fl', label: 'Florida', type: US_REGION_TYPES.STATE },
];

export const expectedUKCountries = [
  { value: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
  { value: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
  { value: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
  { value: 'country/ni', label: 'Northern Ireland', type: UK_REGION_TYPES.COUNTRY },
];

export const expectedUKConstituencies = [
  {
    value: 'constituency/Sheffield Central',
    label: 'Sheffield Central',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
  {
    value: 'constituency/Manchester Central',
    label: 'Manchester Central',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
  {
    value: 'constituency/Brighton Pavilion',
    label: 'Brighton Pavilion',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
];

// Expected congressional districts after filtering
export const expectedUSCongressionalDistricts = [
  {
    value: 'congressional_district/CA-01',
    label: "California's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'CA',
    stateName: 'California',
  },
  {
    value: 'congressional_district/CA-02',
    label: "California's 2nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'CA',
    stateName: 'California',
  },
  {
    value: 'congressional_district/NY-01',
    label: "New York's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'NY',
    stateName: 'New York',
  },
];

// California districts only (for filtering tests)
export const expectedCaliforniaDistricts = [
  {
    value: 'congressional_district/CA-01',
    label: "California's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'CA',
    stateName: 'California',
  },
  {
    value: 'congressional_district/CA-02',
    label: "California's 2nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'CA',
    stateName: 'California',
  },
];

// Mock single-district state (for at-large test)
export const mockSingleDistrictState: MetadataRegionEntry[] = [
  {
    name: 'congressional_district/AK-00',
    label: "Alaska's at-large congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'AK',
    state_name: 'Alaska',
  },
];
