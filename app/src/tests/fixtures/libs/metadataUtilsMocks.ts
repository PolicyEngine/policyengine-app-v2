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
    variables: { age: { label: 'Age' } },
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
