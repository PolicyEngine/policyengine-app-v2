import { transformMetadataPayload } from '@/libs/metadataUtils';
import type { RootState } from '@/store';
import type { MetadataApiPayload } from '@/types/metadata';
import { US_REGION_TYPES } from '@/types/regionTypes';

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
  EMPLOYMENT_INCOME: 'Employment income',
  BRMA: 'Broad Rental Market Area',
  LOCAL_AUTHORITY: 'Local authority',
  HOUSEHOLD_INCOME: 'Household income',
} as const;

export const TEST_TIME_PERIOD_YEARS = {
  THROUGH_2036: [2036, 2035, 2022],
  NONE: [],
} as const;

export const EXPECTED_DATE_RANGES = {
  THROUGH_2036: { minDate: '2022-01-01', maxDate: '2036-12-31' },
  FALLBACK: { minDate: '2022-01-01', maxDate: '2036-12-31' },
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
export const mockStateWithMetadata = (
  overrides?: Partial<MetadataApiPayload['result']>
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

// Helper to create a mock RootState whose metadata offers the given years
export const mockStateWithTimePeriods = (years: readonly number[]): Partial<RootState> =>
  mockStateWithMetadata({
    economy_options: {
      region: [{ name: 'us', label: 'United States', type: US_REGION_TYPES.NATIONAL }],
      time_period: years.map((year) => ({ name: year, label: year.toString() })),
      datasets: [],
    },
  });
