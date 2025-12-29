/**
 * Fixtures for metadata hooks tests
 */
import { MetadataState } from '@/types/metadata';
import { TEST_COUNTRIES, TEST_VERSIONS } from '../api/v2/apiV2Mocks';

// Re-export shared constants
export { TEST_COUNTRIES, TEST_VERSIONS };

// Default year for testing
export const TEST_YEAR = 2025;

// Mock Redux state for metadata
export const MOCK_METADATA_STATE_INITIAL: MetadataState = {
  loading: false,
  loaded: false,
  error: null,
  progress: 0,
  currentCountry: null,
  version: null,
  variables: {},
  parameters: {},
  datasets: [],
  parameterTree: null,
};

export const MOCK_METADATA_STATE_LOADING: MetadataState = {
  ...MOCK_METADATA_STATE_INITIAL,
  loading: true,
};

export const MOCK_METADATA_STATE_LOADED: MetadataState = {
  ...MOCK_METADATA_STATE_INITIAL,
  loaded: true,
  currentCountry: TEST_COUNTRIES.US,
  version: TEST_VERSIONS.US_VERSION,
};

export const MOCK_METADATA_STATE_ERROR: MetadataState = {
  ...MOCK_METADATA_STATE_INITIAL,
  error: 'Failed to load metadata',
};

// Mock variables for entity categorization tests
export const MOCK_VARIABLES_RECORD = {
  age: {
    name: 'age',
    entity: 'person',
    description: 'Age of the person',
    data_type: 'int',
  },
  employment_income: {
    name: 'employment_income',
    entity: 'person',
    description: 'Employment income',
    data_type: 'float',
  },
  state_name: {
    name: 'state_name',
    entity: 'household',
    description: 'State name',
    data_type: 'enum',
  },
  is_married: {
    name: 'is_married',
    entity: 'tax_unit',
    description: 'Whether filing jointly',
    data_type: 'bool',
  },
};

// Expected US entities structure
export const EXPECTED_US_ENTITIES = {
  person: { label: 'Person', plural: 'people', is_person: true },
  family: { label: 'Family', plural: 'families' },
  household: { label: 'Household', plural: 'households' },
  tax_unit: { label: 'Tax Unit', plural: 'tax units' },
  spm_unit: { label: 'SPM Unit', plural: 'SPM units' },
  marital_unit: { label: 'Marital Unit', plural: 'marital units' },
};

// Expected UK entities structure
export const EXPECTED_UK_ENTITIES = {
  person: { label: 'Person', plural: 'people', is_person: true },
  benunit: { label: 'Benefit Unit', plural: 'benefit units' },
  household: { label: 'Household', plural: 'households' },
};

// Mock root state factory
export function createMockRootState(metadataOverrides = {}) {
  return {
    metadata: {
      ...MOCK_METADATA_STATE_INITIAL,
      ...metadataOverrides,
    },
  };
}
