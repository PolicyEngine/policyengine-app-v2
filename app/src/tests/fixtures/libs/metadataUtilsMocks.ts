import { transformMetadataPayload } from '@/libs/metadataUtils';
import type { RootState } from '@/store';
import type { MetadataApiPayload } from '@/types/metadata';
import type {
  ParameterMetadata,
  ParameterMetadataCollection,
} from '@/types/metadata/parameterMetadata';

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

// Search visibility follows buildParameterTree; API defaults arrive as explicit true flags.
export const SEARCH_VISIBILITY_CASES: Array<{
  name: string;
  flags: Pick<ParameterMetadata, 'economy' | 'household'>;
  visible: boolean;
}> = [
  { name: 'true true', flags: { economy: true, household: true }, visible: true },
  { name: 'true false', flags: { economy: true, household: false }, visible: true },
  { name: 'true absent', flags: { economy: true }, visible: true },
  { name: 'false true', flags: { economy: false, household: true }, visible: true },
  { name: 'false false', flags: { economy: false, household: false }, visible: false },
  { name: 'false absent', flags: { economy: false }, visible: false },
  { name: 'absent true', flags: { household: true }, visible: true },
  { name: 'absent false', flags: { household: false }, visible: false },
  { name: 'absent absent', flags: {}, visible: false },
];
export const VISIBLE_SEARCH_PARAMETER: ParameterMetadata = {
  parameter: 'gov.income_tax.basic_rate',
  label: 'Basic tax rate',
  type: 'parameter',
  economy: true,
  household: true,
};
export const SAME_LABEL_SEARCH_PARAMETERS: ParameterMetadataCollection = {
  first: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.income_tax.basic_rate' },
  second: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.capital_gains.basic_rate' },
};
export const SORTED_SEARCH_PARAMETERS: ParameterMetadataCollection = {
  zulu: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.tax.zulu', label: 'Zulu rate' },
  alpha: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.tax.alpha', label: 'Alpha rate' },
};
export const INELIGIBLE_SEARCH_PARAMETERS: ParameterMetadataCollection = {
  node: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.income_tax', type: 'parameterNode' },
  unlabelled: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.tax.unlabelled', label: '' },
  cache: { ...VISIBLE_SEARCH_PARAMETER, parameter: 'gov.pycache.rate' },
};
export function searchVisibilityState(
  parameters: ParameterMetadataCollection | undefined
): RootState {
  return { metadata: { parameters } } as RootState;
}
