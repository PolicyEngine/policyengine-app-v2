import type { MetadataState } from '@/types/metadata';

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
  UK_CONSTITUENCY_PREFIXED: 'constituency/Sheffield Central',
  UK_COUNTRY_PREFIXED: 'country/england',
} as const;

export const mockMetadataWithRegions = (): MetadataState => ({
  currentCountry: 'us',
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: [
      { name: 'state/ca', label: 'California' },
      { name: 'state/tx', label: 'Texas' },
      { name: 'constituency/E14000698', label: 'Cities of London and Westminster' },
      { name: 'constituency/Sheffield Central', label: 'Sheffield Central' },
      { name: 'country/england', label: 'England' },
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
  loading: false,
  error: null,
});
