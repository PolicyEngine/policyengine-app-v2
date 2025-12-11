import { CURRENT_YEAR } from '@/constants';
import { MetadataState } from '@/types/metadata';
import { UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';

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
    tax_rate: { label: 'Tax Rate', values: { [CURRENT_YEAR]: 0.25 } },
  },
  entities: {
    person: { label: 'Person', plural: 'People' },
  },
  variableModules: {
    person: { label: 'Person', description: 'Person variables' },
  },
  economyOptions: {
    region: [{ name: 'us', label: 'United States', type: US_REGION_TYPES.NATIONAL }],
    time_period: [{ name: parseInt(CURRENT_YEAR, 10), label: CURRENT_YEAR }],
    datasets: [
      {
        name: `cps_${CURRENT_YEAR}`,
        label: `CPS ${CURRENT_YEAR}`,
        title: `Current Population Survey ${CURRENT_YEAR}`,
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
    region: [{ name: 'uk', label: 'United Kingdom', type: UK_REGION_TYPES.NATIONAL }],
    time_period: [{ name: parseInt(CURRENT_YEAR, 10), label: CURRENT_YEAR }],
    datasets: [
      {
        name: `frs_${CURRENT_YEAR}`,
        label: `FRS ${CURRENT_YEAR}`,
        title: `Family Resources Survey ${CURRENT_YEAR}`,
        default: true,
      },
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
