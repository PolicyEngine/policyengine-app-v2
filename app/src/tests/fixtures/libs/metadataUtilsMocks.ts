import { RootState } from '@/store';
import { MetadataApiPayload, MetadataState } from '@/types/metadata';

// Test constants for expected values
export const EXPECTED_MIN_DATE_DEFAULT = '2022-01-01';
export const EXPECTED_MAX_DATE_DEFAULT = '2035-12-31';
export const EXPECTED_MIN_DATE = '2022-01-01';
export const EXPECTED_MAX_DATE = '2025-12-31';
export const EXPECTED_COUNTRY = 'us';
export const EXPECTED_VERSION = '1.0.0';
export const EXPECTED_CURRENT_LAW_ID = 1;

// Time period constants
export const TIME_PERIOD_2022 = {
  name: 2022,
  label: '2022',
};
export const TIME_PERIOD_2023 = {
  name: 2023,
  label: '2023',
};
export const TIME_PERIOD_2024 = {
  name: 2024,
  label: '2024',
};
export const TIME_PERIOD_2025 = {
  name: 2025,
  label: '2025',
};

export const MOCK_TIME_PERIODS = [
  TIME_PERIOD_2022,
  TIME_PERIOD_2023,
  TIME_PERIOD_2024,
  TIME_PERIOD_2025,
];

// Region constants
export const REGION_CA = {
  name: 'ca',
  label: 'California',
};
export const REGION_NY = {
  name: 'ny',
  label: 'New York',
};
export const REGION_TX = {
  name: 'tx',
  label: 'Texas',
};

export const MOCK_REGIONS = [REGION_CA, REGION_NY, REGION_TX];

// Basic input field names
export const FIELD_AGE = 'age';
export const FIELD_EMPLOYMENT_INCOME = 'employment_income';
export const FIELD_STATE_NAME = 'state_name';
export const FIELD_REGION = 'region';
export const FIELD_BRMA = 'brma';
export const FIELD_LOCAL_AUTHORITY = 'local_authority';
export const FIELD_MARITAL_STATUS = 'marital_status';
export const FIELD_CHILDREN_COUNT = 'children_count';
export const FIELD_UNKNOWN = 'unknown_field';
export const FIELD_CUSTOM = 'custom_field_name';

// Expected labels
export const EXPECTED_LABEL_STATE = 'State';
export const EXPECTED_LABEL_REGION = 'Region';
export const EXPECTED_LABEL_BRMA = 'Broad Rental Market Area';
export const EXPECTED_LABEL_LOCAL_AUTHORITY = 'Local Authority';
export const EXPECTED_LABEL_AGE = 'Age';
export const EXPECTED_LABEL_EMPLOYMENT_INCOME = 'Employment Income';
export const EXPECTED_LABEL_CUSTOM = 'Custom Field Name';

// Dropdown field list
export const DROPDOWN_FIELDS = [
  FIELD_STATE_NAME,
  FIELD_REGION,
  FIELD_BRMA,
  FIELD_LOCAL_AUTHORITY,
];

// Non-dropdown fields
export const NON_DROPDOWN_FIELDS = [
  FIELD_AGE,
  FIELD_EMPLOYMENT_INCOME,
  FIELD_MARITAL_STATUS,
  FIELD_CHILDREN_COUNT,
];

// Person-level fields
export const PERSON_FIELDS = [FIELD_AGE, FIELD_EMPLOYMENT_INCOME];

// Household-level fields
export const HOUSEHOLD_FIELDS = [FIELD_STATE_NAME, FIELD_MARITAL_STATUS, FIELD_CHILDREN_COUNT];

// All basic input fields
export const ALL_BASIC_INPUT_FIELDS = [...PERSON_FIELDS, ...HOUSEHOLD_FIELDS];

// Mock variables with possible values
export const MOCK_VARIABLES_WITH_OPTIONS = {
  [FIELD_MARITAL_STATUS]: {
    label: 'Marital Status',
    possible_values: {
      single: 'Single',
      married: 'Married',
      divorced: 'Divorced',
      widowed: 'Widowed',
    },
  },
  [FIELD_EMPLOYMENT_INCOME]: {
    label: 'Employment Income',
    // No possible_values - should return empty array
  },
};

// Expected field options
export const EXPECTED_MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export const EXPECTED_REGION_OPTIONS = [
  { value: REGION_CA.name, label: REGION_CA.label },
  { value: REGION_NY.name, label: REGION_NY.label },
  { value: REGION_TX.name, label: REGION_TX.label },
];

export const EXPECTED_TAX_YEAR_OPTIONS = [
  { value: '2022', label: '2022' },
  { value: '2023', label: '2023' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
];

export const EXPECTED_EMPTY_OPTIONS: never[] = [];

// Mock metadata state
export const createMockMetadataState = (overrides?: Partial<MetadataState>): MetadataState => ({
  currentCountry: EXPECTED_COUNTRY,
  loading: false,
  error: null,
  variables: MOCK_VARIABLES_WITH_OPTIONS,
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: MOCK_REGIONS,
    time_period: MOCK_TIME_PERIODS,
    datasets: [],
  },
  currentLawId: EXPECTED_CURRENT_LAW_ID,
  basicInputs: ALL_BASIC_INPUT_FIELDS,
  modelledPolicies: {
    core: {},
    filtered: {},
  },
  version: EXPECTED_VERSION,
  parameterTree: null,
  lastFetched: {
    [EXPECTED_COUNTRY]: Date.now(),
  },
  ...overrides,
});

// Mock root state with metadata
export const createMockRootState = (metadataOverrides?: Partial<MetadataState>): RootState => ({
  metadata: createMockMetadataState(metadataOverrides),
  // Add other slices as needed for tests
} as RootState);

// Mock empty metadata state
export const MOCK_EMPTY_METADATA_STATE: MetadataState = {
  currentCountry: null,
  loading: false,
  error: null,
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: [],
    time_period: [],
    datasets: [],
  },
  currentLawId: 0,
  basicInputs: [],
  modelledPolicies: {
    core: {},
    filtered: {},
  },
  version: null,
  parameterTree: null,
  lastFetched: {},
};

// Mock API payload
export const createMockMetadataApiPayload = (
  overrides?: Partial<MetadataApiPayload['result']>
): MetadataApiPayload => ({
  status: 'ok',
  message: null,
  result: {
    variables: MOCK_VARIABLES_WITH_OPTIONS,
    parameters: {},
    entities: {},
    variableModules: {},
    economy_options: {
      region: MOCK_REGIONS,
      time_period: MOCK_TIME_PERIODS,
      datasets: [],
    },
    current_law_id: EXPECTED_CURRENT_LAW_ID,
    basicInputs: ALL_BASIC_INPUT_FIELDS,
    modelled_policies: {
      core: {},
      filtered: {},
    },
    version: EXPECTED_VERSION,
    ...overrides,
  },
});

// Expected transformed metadata
export const EXPECTED_TRANSFORMED_METADATA = {
  currentCountry: EXPECTED_COUNTRY,
  variables: MOCK_VARIABLES_WITH_OPTIONS,
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: MOCK_REGIONS,
    time_period: MOCK_TIME_PERIODS,
    datasets: [],
  },
  currentLawId: EXPECTED_CURRENT_LAW_ID,
  basicInputs: ALL_BASIC_INPUT_FIELDS,
  modelledPolicies: {
    core: {},
    filtered: {},
  },
  version: EXPECTED_VERSION,
  parameterTree: null,
};

// Test utility functions
export const expectOptionsToEqual = (
  actual: Array<{ value: string; label: string }>,
  expected: Array<{ value: string; label: string }>
) => {
  expect(actual).toEqual(expected);
};

export const expectDateRangeToEqual = (
  actual: { minDate: string; maxDate: string },
  expectedMin: string,
  expectedMax: string
) => {
  expect(actual.minDate).toBe(expectedMin);
  expect(actual.maxDate).toBe(expectedMax);
};

export const expectFieldsToEqual = (
  actual: { person: string[]; household: string[] },
  expectedPerson: string[],
  expectedHousehold: string[]
) => {
  expect(actual.person).toEqual(expectedPerson);
  expect(actual.household).toEqual(expectedHousehold);
};