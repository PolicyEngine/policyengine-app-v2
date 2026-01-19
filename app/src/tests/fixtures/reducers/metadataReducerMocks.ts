import { CURRENT_YEAR } from '@/constants';
import { ParameterTreeNode } from '@/libs/buildParameterTree';
import { MetadataState, VariableMetadata, ParameterMetadata } from '@/types/metadata';
import { US_REGION_TYPES } from '@/types/regionTypes';

// Test constants
export const TEST_COUNTRY_US = 'us';
export const TEST_COUNTRY_UK = 'uk';
export const TEST_COUNTRY_CA = 'ca';
export const TEST_ERROR_MESSAGE = 'Failed to fetch metadata';
export const TEST_VERSION = '2.0.0';
export const TEST_CURRENT_LAW_ID = 42;
export const TEST_PARAMETER_KEY = 'gov.tax.income_tax';
export const TEST_PARAMETER_LABEL = 'Income Tax';
export const TEST_VARIABLE_KEY = 'employment_income';
export const TEST_ENTITY_KEY = 'person';

// Default unified loading states
export const DEFAULT_LOADING_STATES = {
  loading: false,
  loaded: false,
  error: null,
} as const;

// Expected initial state (only contains API-driven data, not static data)
export const EXPECTED_INITIAL_STATE: MetadataState = {
  currentCountry: null,
  ...DEFAULT_LOADING_STATES,
  progress: 0,
  variables: {},
  parameters: {},
  datasets: [],
  version: null,
  parameterTree: null,
};

// Mock variables
export const MOCK_VARIABLES: Record<string, VariableMetadata> = {
  [TEST_VARIABLE_KEY]: {
    name: TEST_VARIABLE_KEY,
    entity: 'person',
    description: 'Annual employment income',
    label: 'Employment Income',
    unit: 'currency-USD',
    documentation: 'Annual employment income',
  },
  marital_status: {
    name: 'marital_status',
    entity: 'person',
    description: 'Marital status of the person',
    label: 'Marital Status',
    possible_values: {
      single: 'Single',
      married: 'Married',
    },
  },
};

// Mock parameters
export const MOCK_PARAMETERS: Record<string, ParameterMetadata> = {
  [TEST_PARAMETER_KEY]: {
    parameter: TEST_PARAMETER_KEY,
    label: TEST_PARAMETER_LABEL,
    unit: 'currency-USD',
    values: { [CURRENT_YEAR]: 0.2 },
    economy: true,
    household: false,
  },
  'gov.benefit.child_benefit': {
    parameter: 'gov.benefit.child_benefit',
    label: 'Child Benefit',
    unit: 'currency-USD',
    values: { [CURRENT_YEAR]: 1000 },
    economy: false,
    household: true,
  },
};

// Mock entities
export const MOCK_ENTITIES = {
  [TEST_ENTITY_KEY]: {
    label: 'Person',
    plural: 'people',
  },
  household: {
    label: 'Household',
    plural: 'households',
  },
};

// Mock variable modules
export const MOCK_VARIABLE_MODULES = {
  'gov.tax': {
    label: 'Taxation',
  },
  'gov.benefit': {
    label: 'Benefits',
  },
};

// Mock economy options
export const MOCK_ECONOMY_OPTIONS = {
  region: [
    { name: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
    { name: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
    { name: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
  ],
  time_period: [
    { name: 2022, label: '2022' },
    { name: 2023, label: '2023' },
    { name: parseInt(CURRENT_YEAR, 10), label: CURRENT_YEAR },
  ],
  datasets: [
    { name: 'cps_2022', label: 'CPS 2022', title: 'Current Population Survey 2022', default: true },
    {
      name: 'acs_2021',
      label: 'ACS 2021',
      title: 'American Community Survey 2021',
      default: false,
    },
  ],
};

// Mock basic inputs
export const MOCK_BASIC_INPUTS = ['age', 'employment_income', 'state_name'];

// Mock modelled policies
export const MOCK_MODELLED_POLICIES = {
  core: {
    baseline: { label: 'Current Law', id: 1 },
    reform: { label: 'Reform Package', id: 2 },
  },
  filtered: {
    baseline: { label: 'Current Law', id: 1 },
  },
};

// Mock parameter tree
export const MOCK_PARAMETER_TREE: ParameterTreeNode = {
  name: 'gov',
  label: 'Government',
  index: 0,
  children: [
    {
      name: 'gov.tax',
      label: 'Tax',
      index: 0,
      children: [
        {
          name: TEST_PARAMETER_KEY,
          label: TEST_PARAMETER_LABEL,
          index: 0,
          parameter: TEST_PARAMETER_KEY,
          type: 'parameter',
        },
      ],
      type: 'parameterNode',
    },
  ],
  type: 'parameterNode',
};

// Mock state with data (only API-driven data)
export const createMockStateWithData = (overrides?: Partial<MetadataState>): MetadataState => ({
  currentCountry: TEST_COUNTRY_US,
  ...DEFAULT_LOADING_STATES,
  loaded: true,
  progress: 100,
  variables: MOCK_VARIABLES,
  parameters: MOCK_PARAMETERS,
  datasets: MOCK_ECONOMY_OPTIONS.datasets,
  version: TEST_VERSION,
  parameterTree: MOCK_PARAMETER_TREE,
  ...overrides,
});

// Mock loading state
export const MOCK_LOADING_STATE: MetadataState = {
  ...EXPECTED_INITIAL_STATE,
  loading: true,
};

// Mock error state
export const MOCK_ERROR_STATE: MetadataState = {
  ...EXPECTED_INITIAL_STATE,
  error: TEST_ERROR_MESSAGE,
};

// Mock state after clearing
export const createMockClearedState = (country: string | null): MetadataState => ({
  ...EXPECTED_INITIAL_STATE,
  currentCountry: country,
});

// Test utility functions
export const expectStateToEqual = (actual: MetadataState, expected: MetadataState) => {
  expect(actual).toEqual(expected);
};

export const expectLoadingState = (state: MetadataState, isLoading: boolean) => {
  expect(state.loading).toBe(isLoading);
};

export const expectErrorState = (state: MetadataState, error: string | null) => {
  expect(state.error).toBe(error);
};

export const expectCurrentCountry = (state: MetadataState, country: string | null) => {
  expect(state.currentCountry).toBe(country);
};

export const expectVersion = (state: MetadataState, version: string | null) => {
  expect(state.version).toBe(version);
};

export const expectParameterTree = (state: MetadataState, hasTree: boolean) => {
  if (hasTree) {
    expect(state.parameterTree).toBeDefined();
    expect(state.parameterTree).not.toBeNull();
  } else {
    expect(state.parameterTree).toBeNull();
  }
};

export const expectEmptyMetadata = (state: MetadataState) => {
  expect(state.variables).toEqual({});
  expect(state.parameters).toEqual({});
  expect(state.datasets).toEqual([]);
  expect(state.version).toBeNull();
  expect(state.parameterTree).toBeNull();
};
