import type { MetadataApiPayload } from '@/types/metadata';
import type { RootState } from '@/store';
import { transformMetadataPayload } from '@/libs/metadataUtils';

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

export const mockMetadataPayload = (overrides?: any): MetadataApiPayload => ({
  status: 'ok',
  message: 'Success',
  result: {
    variables: {
      age: { label: 'Age' },
      state_name: {
        label: 'State',
        possibleValues: [
          { value: 'CA', label: 'California' },
          { value: 'NY', label: 'New York' },
        ],
      },
      region: {
        label: 'Region',
        possibleValues: [
          { value: 'NORTH_EAST', label: 'North East' },
          { value: 'SOUTH', label: 'South' },
        ],
      },
      brma: {
        label: 'BRMA',
        possibleValues: [
          { value: 'LONDON', label: 'London' },
          { value: 'MANCHESTER', label: 'Manchester' },
        ],
      },
      local_authority: {
        label: 'Local Authority',
        possibleValues: [
          { value: 'WESTMINSTER', label: 'Westminster' },
          { value: 'CAMDEN', label: 'Camden' },
        ],
      },
      employment_income: { label: 'Employment Income' },
    },
    parameters: { tax_rate: {} },
    entities: { person: {} },
    variableModules: { household: ['age'] },
    economy_options: {
      region: [{ name: 'us', label: 'United States' }],
      time_period: [{ name: 2024, label: '2024' }],
      datasets: [],
    },
    current_law_id: 1,
    basicInputs: ['age', 'employment_income'],
    modelled_policies: {
      core: { '1': 'Policy 1' },
      filtered: {},
    },
    version: '1.0.0',
    ...overrides,
  },
});

export const mockMinimalPayload = (): MetadataApiPayload => ({
  status: 'ok',
  message: 'Success',
  result: {
    variables: {},
    parameters: {},
    entities: {},
  } as any,
});

// Helper to create a mock RootState with metadata for testing
export const mockStateWithMetadata = (overrides?: Partial<MetadataApiPayload>): Partial<RootState> => {
  const payload = mockMetadataPayload(overrides);
  const metadata = transformMetadataPayload(payload, 'us');

  return {
    metadata: {
      ...metadata,
      loading: false,
      error: null,
      lastFetched: null,
    },
  } as Partial<RootState>;
};
