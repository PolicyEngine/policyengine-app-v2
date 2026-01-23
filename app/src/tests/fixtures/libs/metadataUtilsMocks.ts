import type { RootState } from '@/store';
import type { VariableMetadata } from '@/types/metadata';

export const TEST_FIELD_NAMES = {
  STATE_NAME: 'state_name',
  REGION: 'region',
  AGE: 'age',
  EMPLOYMENT_INCOME: 'employment_income',
  BRMA: 'brma',
  LOCAL_AUTHORITY: 'local_authority',
  HOUSEHOLD_INCOME: 'household_income',
} as const;

export const EXPECTED_LABELS = {
  STATE: 'State',
  REGION: 'Region',
  AGE: 'Age',
  EMPLOYMENT_INCOME: 'Employment Income',
  BRMA: 'Broad Rental Market Area',
  LOCAL_AUTHORITY: 'Local Authority',
  HOUSEHOLD_INCOME: 'Household Income',
} as const;

/**
 * Mock variables for testing metadataUtils functions
 */
export const MOCK_VARIABLES: Record<string, VariableMetadata> = {
  age: { name: 'age', entity: 'person', description: 'Age', label: 'Age' },
  state_name: {
    name: 'state_name',
    entity: 'household',
    description: 'State Name',
    label: 'State',
    possible_values: {
      CA: 'California',
      NY: 'New York',
    },
  },
  region: {
    name: 'region',
    entity: 'household',
    description: 'Region',
    label: 'Region',
    possible_values: {
      NORTH_EAST: 'North East',
      SOUTH: 'South',
    },
  },
  brma: {
    name: 'brma',
    entity: 'household',
    description: 'BRMA',
    label: 'BRMA',
    possible_values: {
      LONDON: 'London',
      MANCHESTER: 'Manchester',
    },
  },
  local_authority: {
    name: 'local_authority',
    entity: 'household',
    description: 'Local Authority',
    label: 'Local Authority',
    possible_values: {
      WESTMINSTER: 'Westminster',
      CAMDEN: 'Camden',
    },
  },
  employment_income: {
    name: 'employment_income',
    entity: 'person',
    description: 'Employment Income',
    label: 'Employment Income',
  },
};

/**
 * Creates a mock RootState with variables for testing metadataUtils functions
 */
export const mockStateWithVariables = (): Partial<RootState> => {
  return {
    metadata: {
      currentCountry: 'us',
      loading: false,
      loaded: true,
      error: null,
      progress: 100,
      variables: MOCK_VARIABLES,
      parameters: {},
      datasets: [],
      version: '1.0.0',
      parameterTree: null,
    },
  } as Partial<RootState>;
};
