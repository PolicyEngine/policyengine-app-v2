import { transformMetadataPayload } from '@/libs/metadataUtils';
import type { RootState } from '@/store';
import type { MetadataApiPayload } from '@/types/metadata';

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
export const mockStateWithMetadata = (
  overrides?: Partial<MetadataApiPayload>
): Partial<RootState> => {
  const payload = mockMetadataPayload(overrides);
  const metadata = transformMetadataPayload(payload, 'us');

  return {
    metadata: {
      ...metadata,
      loading: false,
      error: null,
      progress: 100,
    },
  } as Partial<RootState>;
};
