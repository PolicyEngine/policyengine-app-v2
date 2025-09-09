import { MetadataState } from '@/types/metadata';

// Test country IDs
export const TEST_COUNTRY_US = 'us';
export const TEST_COUNTRY_UK = 'uk';
export const TEST_COUNTRY_CA = 'ca';

// Test error message
export const TEST_ERROR_MESSAGE = 'Previous fetch failed';

// Mock metadata states
export const mockInitialMetadataState: MetadataState = {
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

export const mockLoadingMetadataState: MetadataState = {
  ...mockInitialMetadataState,
  loading: true,
  currentCountry: TEST_COUNTRY_US,
};

export const mockLoadedMetadataState: MetadataState = {
  loading: false,
  error: null,
  currentCountry: TEST_COUNTRY_US,
  variables: {
    income: { label: 'Income', unit: 'currency-USD' },
    age: { label: 'Age', unit: 'year' },
  },
  parameters: {
    tax_rate: { label: 'Tax Rate', values: { '2024': 0.25 } },
  },
  entities: {
    person: { label: 'Person', plural: 'People' },
  },
  variableModules: {
    person: { label: 'Person', description: 'Person variables' },
  },
  economyOptions: {
    region: [{ name: 'us', label: 'United States' }],
    time_period: [{ name: 2024, label: '2024' }],
    datasets: [
      {
        name: 'cps_2024',
        label: 'CPS 2024',
        title: 'Current Population Survey 2024',
        default: true,
      },
    ],
  },
  currentLawId: 1,
  basicInputs: ['income', 'age'],
  modelledPolicies: {
    core: { baseline: { id: 1, label: 'Current Law' } },
    filtered: {},
  },
  version: '1.0.0',
  parameterTree: {
    name: 'root',
    label: 'Parameters',
    index: 0,
    children: [],
  },
};

export const mockUKMetadataState: MetadataState = {
  ...mockLoadedMetadataState,
  currentCountry: TEST_COUNTRY_UK,
  variables: {
    income: { label: 'Income', unit: 'currency-GBP' },
  },
  economyOptions: {
    region: [{ name: 'uk', label: 'United Kingdom' }],
    time_period: [{ name: 2024, label: '2024' }],
    datasets: [
      { name: 'frs_2024', label: 'FRS 2024', title: 'Family Resources Survey 2024', default: true },
    ],
  },
  version: '2.0.0',
};

export const mockStateWithCurrentCountry: MetadataState = {
  ...mockInitialMetadataState,
  currentCountry: TEST_COUNTRY_CA,
};

export const mockStateWithoutVersion: MetadataState = {
  ...mockLoadedMetadataState,
  version: null,
};

export const mockErrorState: MetadataState = {
  ...mockInitialMetadataState,
  error: TEST_ERROR_MESSAGE,
  currentCountry: TEST_COUNTRY_US,
};
