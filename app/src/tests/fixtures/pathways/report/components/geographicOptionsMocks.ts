import { RegionOption, UK_REGION_TYPES, US_REGION_TYPES } from '@/utils/regionStrategies';

// Mock US state options
export const mockUSStateOptions: RegionOption[] = [
  { value: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
  { value: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
  { value: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
];

// Mock US congressional district options
export const mockUSDistrictOptions: RegionOption[] = [
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

// Mock US single-district state (at-large)
export const mockUSSingleDistrictOptions: RegionOption[] = [
  {
    value: 'congressional_district/AK-00',
    label: "Alaska's at-large congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'AK',
    stateName: 'Alaska',
  },
];

// Mock UK country options
export const mockUKCountryOptions: RegionOption[] = [
  { value: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
  { value: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
  { value: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
];

// Mock UK constituency options
export const mockUKConstituencyOptions: RegionOption[] = [
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
];

// Mock UK local authority options
export const mockUKLocalAuthorityOptions: RegionOption[] = [
  {
    value: 'local_authority/Maidstone',
    label: 'Maidstone',
    type: UK_REGION_TYPES.LOCAL_AUTHORITY,
  },
  {
    value: 'local_authority/Westminster',
    label: 'Westminster',
    type: UK_REGION_TYPES.LOCAL_AUTHORITY,
  },
];

// Test constants
export const TEST_VALUES = {
  CALIFORNIA_STATE: 'state/ca',
  NEW_YORK_STATE: 'state/ny',
  CALIFORNIA_DISTRICT_1: 'congressional_district/CA-01',
  ENGLAND_COUNTRY: 'country/england',
  SHEFFIELD_CONSTITUENCY: 'constituency/Sheffield Central',
} as const;
