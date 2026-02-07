/**
 * Fixtures for useLazyParameterTree hook tests
 */
import { vi } from 'vitest';
import { MetadataState, ParameterMetadata } from '@/types/metadata';

// Test states
export const TEST_STATES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  EMPTY: 'empty',
} as const;

// Test error message
export const TEST_ERROR_MESSAGE = 'Failed to load parameters';

// Mock parameters for hook tests
export const MOCK_PARAMETERS_FOR_HOOK: Record<string, ParameterMetadata> = {
  'gov.tax.rate': {
    parameter: 'gov.tax.rate',
    label: 'Tax Rate',
    type: 'parameter',
    values: {},
  },
  'gov.tax.threshold': {
    parameter: 'gov.tax.threshold',
    label: 'Tax Threshold',
    type: 'parameter',
    values: {},
  },
  'gov.benefit.amount': {
    parameter: 'gov.benefit.amount',
    label: 'Benefit Amount',
    type: 'parameter',
    values: {},
  },
};

// Base metadata state (no parameters)
const BASE_METADATA_STATE: MetadataState = {
  currentCountry: null,
  loading: false,
  loaded: false,
  error: null,
  progress: 0,
  variables: {},
  parameters: {},
  datasets: [],
  version: null,
};

// Mock metadata state: loading
export const MOCK_METADATA_LOADING: MetadataState = {
  ...BASE_METADATA_STATE,
  loading: true,
  currentCountry: 'us',
};

// Mock metadata state: loaded with parameters
export const MOCK_METADATA_LOADED: MetadataState = {
  ...BASE_METADATA_STATE,
  loaded: true,
  currentCountry: 'us',
  parameters: MOCK_PARAMETERS_FOR_HOOK,
  version: '1.0.0',
};

// Mock metadata state: error
export const MOCK_METADATA_ERROR: MetadataState = {
  ...BASE_METADATA_STATE,
  error: TEST_ERROR_MESSAGE,
  currentCountry: 'us',
};

// Mock metadata state: empty parameters
export const MOCK_METADATA_EMPTY: MetadataState = {
  ...BASE_METADATA_STATE,
  loaded: true,
  currentCountry: 'us',
  parameters: {},
  version: '1.0.0',
};

// Factory to create root state
export function createMockRootState(metadataOverrides: Partial<MetadataState> = {}): {
  metadata: MetadataState;
} {
  return {
    metadata: {
      ...BASE_METADATA_STATE,
      ...metadataOverrides,
    },
  };
}

// Mock selector for useSelector
export function createMockUseSelector(state: { metadata: MetadataState }) {
  return vi.fn((selector: (state: { metadata: MetadataState }) => unknown) => selector(state));
}

// Expected children for 'gov' path
export const EXPECTED_GOV_CHILDREN = [
  { name: 'gov.benefit', label: 'Benefit', type: 'parameterNode' },
  { name: 'gov.tax', label: 'Tax', type: 'parameterNode' },
];

// Expected children for 'gov.tax' path
export const EXPECTED_TAX_CHILDREN = [
  { name: 'gov.tax.rate', label: 'Tax Rate', type: 'parameter' },
  { name: 'gov.tax.threshold', label: 'Tax Threshold', type: 'parameter' },
];
