import { MetadataState, MetadataApiPayload } from '@/types/metadata';
import { ParameterTreeNode } from '@/libs/buildParameterTree';

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

// Expected initial state
export const EXPECTED_INITIAL_STATE: MetadataState = {
  loading: false,
  error: null,
  currentCountry: null,
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: { region: [], time_period: [], datasets: [] },
  currentLawId: 0,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: null,
  parameterTree: null,
};

// Mock variables
export const MOCK_VARIABLES = {
  [TEST_VARIABLE_KEY]: {
    label: 'Employment Income',
    unit: 'currency-USD',
    documentation: 'Annual employment income',
  },
  marital_status: {
    label: 'Marital Status',
    possible_values: {
      single: 'Single',
      married: 'Married',
    },
  },
};

// Mock parameters
export const MOCK_PARAMETERS = {
  [TEST_PARAMETER_KEY]: {
    parameter: TEST_PARAMETER_KEY,
    label: TEST_PARAMETER_LABEL,
    unit: 'currency-USD',
    values: { '2024': 0.2 },
    economy: true,
    household: false,
  },
  'gov.benefit.child_benefit': {
    parameter: 'gov.benefit.child_benefit',
    label: 'Child Benefit',
    unit: 'currency-USD',
    values: { '2024': 1000 },
    economy: false,
    household: true,
  },
};

// Mock entities
export const MOCK_ENTITIES = {
  [TEST_ENTITY_KEY]: {
    label: 'Person',
    plural: 'people',
    documentation: 'A person entity',
  },
  household: {
    label: 'Household',
    plural: 'households',
    documentation: 'A household entity',
  },
};

// Mock variable modules
export const MOCK_VARIABLE_MODULES = {
  'gov.tax': {
    label: 'Taxation',
    documentation: 'Tax-related variables',
  },
  'gov.benefit': {
    label: 'Benefits',
    documentation: 'Benefit-related variables',
  },
};

// Mock economy options
export const MOCK_ECONOMY_OPTIONS = {
  region: [
    { name: 'ca', label: 'California' },
    { name: 'ny', label: 'New York' },
    { name: 'tx', label: 'Texas' },
  ],
  time_period: [
    { name: 2022, label: '2022' },
    { name: 2023, label: '2023' },
    { name: 2024, label: '2024' },
  ],
  datasets: [
    { name: 'cps_2022', label: 'CPS 2022', title: 'Current Population Survey 2022', default: true },
    { name: 'acs_2021', label: 'ACS 2021', title: 'American Community Survey 2021', default: false },
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

// Mock API payload
export const createMockApiPayload = (
  overrides?: Partial<MetadataApiPayload['result']>
): MetadataApiPayload => ({
  status: 'ok',
  message: null,
  result: {
    variables: MOCK_VARIABLES,
    parameters: MOCK_PARAMETERS,
    entities: MOCK_ENTITIES,
    variableModules: MOCK_VARIABLE_MODULES,
    economy_options: MOCK_ECONOMY_OPTIONS,
    current_law_id: TEST_CURRENT_LAW_ID,
    basicInputs: MOCK_BASIC_INPUTS,
    modelled_policies: MOCK_MODELLED_POLICIES,
    version: TEST_VERSION,
    ...overrides,
  },
});

// Mock state with data
export const createMockStateWithData = (
  overrides?: Partial<MetadataState>
): MetadataState => ({
  loading: false,
  error: null,
  currentCountry: TEST_COUNTRY_US,
  variables: MOCK_VARIABLES,
  parameters: MOCK_PARAMETERS,
  entities: MOCK_ENTITIES,
  variableModules: MOCK_VARIABLE_MODULES,
  economyOptions: MOCK_ECONOMY_OPTIONS,
  currentLawId: TEST_CURRENT_LAW_ID,
  basicInputs: MOCK_BASIC_INPUTS,
  modelledPolicies: MOCK_MODELLED_POLICIES,
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

// Expected state after successful fetch
export const createExpectedFulfilledState = (
  country: string,
  apiPayload: MetadataApiPayload
): MetadataState => ({
  loading: false,
  error: null,
  currentCountry: country,
  variables: apiPayload.result.variables,
  parameters: apiPayload.result.parameters,
  entities: apiPayload.result.entities,
  variableModules: apiPayload.result.variableModules,
  economyOptions: apiPayload.result.economy_options,
  currentLawId: apiPayload.result.current_law_id,
  basicInputs: apiPayload.result.basicInputs,
  modelledPolicies: apiPayload.result.modelled_policies,
  version: apiPayload.result.version,
  parameterTree: null, // Will be built by reducer
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

export const expectParameterTree = (
  state: MetadataState,
  hasTree: boolean
) => {
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
  expect(state.entities).toEqual({});
  expect(state.variableModules).toEqual({});
  expect(state.economyOptions).toEqual({ region: [], time_period: [], datasets: [] });
  expect(state.currentLawId).toBe(0);
  expect(state.basicInputs).toEqual([]);
  expect(state.modelledPolicies).toEqual({ core: {}, filtered: {} });
  expect(state.version).toBeNull();
  expect(state.parameterTree).toBeNull();
};