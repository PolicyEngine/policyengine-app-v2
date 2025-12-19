import type { MetadataState } from '@/types/metadata';
import { UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';
import { DEFAULT_V2_LOADING_STATES } from '../reducers/metadataReducerMocks';

export const TEST_COUNTRY_CODES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  UNKNOWN: 'zz',
} as const;

export const EXPECTED_COUNTRY_LABELS = {
  US: 'United States',
  UK: 'United Kingdom',
  CA: 'Canada',
  UNKNOWN: 'Unknown Country',
} as const;

export const TEST_REGION_CODES = {
  CALIFORNIA: 'ca',
  TEXAS: 'tx',
  LONDON: 'E14000698',
  WALES: 'wales',
  UK_CONSTITUENCY_PREFIXED: 'constituency/Sheffield Central',
  UK_COUNTRY_PREFIXED: 'country/england',
  // Congressional district codes
  US_CONGRESSIONAL_DISTRICT_PREFIXED: 'congressional_district/CA-01',
  US_CONGRESSIONAL_DISTRICT_CODE: 'CA-01',
  // Legacy US state codes (without prefix)
  US_LEGACY_STATE_TX: 'tx',
  US_LEGACY_CITY_NYC: 'nyc',
} as const;

export const EXPECTED_REGION_TYPE_LABELS = {
  STATE: 'State',
  COUNTRY: 'Country',
  CONSTITUENCY: 'Constituency',
  REGION: 'Region',
  CONGRESSIONAL_DISTRICT: 'Congressional district',
} as const;

export const mockMetadataWithRegions = (): MetadataState => ({
  currentCountry: 'us',
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: [
      { name: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
      { name: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
      {
        name: 'congressional_district/CA-01',
        label: "California's 1st congressional district",
        type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
        state_abbreviation: 'CA',
        state_name: 'California',
      },
      { name: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
      { name: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
      {
        name: 'constituency/E14000698',
        label: 'Cities of London and Westminster',
        type: UK_REGION_TYPES.CONSTITUENCY,
      },
      {
        name: 'constituency/Sheffield Central',
        label: 'Sheffield Central',
        type: UK_REGION_TYPES.CONSTITUENCY,
      },
      { name: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
    ],
    time_period: [],
    datasets: [],
  },
  currentLawId: 1,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: '1.0.0',
  parameterTree: null,
  loading: false,
  error: null,
  ...DEFAULT_V2_LOADING_STATES,
  progress: 100,
});

export const mockMetadataEmptyRegions = (): MetadataState => ({
  currentCountry: 'us',
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: [],
    time_period: [],
    datasets: [],
  },
  currentLawId: 1,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: '1.0.0',
  parameterTree: null,
  progress: 100,
  loading: false,
  error: null,
  ...DEFAULT_V2_LOADING_STATES,
});
