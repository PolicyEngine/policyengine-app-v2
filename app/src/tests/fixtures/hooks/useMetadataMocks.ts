import { CURRENT_YEAR } from '@/constants';
import { MetadataState, ParameterMetadata, VariableMetadata } from '@/types/metadata';
import { DEFAULT_LOADING_STATES } from '../reducers/metadataReducerMocks';

// Test country IDs
export const TEST_COUNTRY_US = 'us';
export const TEST_COUNTRY_UK = 'uk';
export const TEST_COUNTRY_CA = 'ca';

// Test error message
export const TEST_ERROR_MESSAGE = 'Previous fetch failed';

// Mock metadata states (only API-driven data, not static data)
export const mockInitialMetadataState: MetadataState = {
  currentCountry: null,
  ...DEFAULT_LOADING_STATES,
  progress: 0,
  variables: {},
  parameters: {},
  datasets: [],
  version: null,
  parameterTree: null,
};

export const mockLoadingMetadataState: MetadataState = {
  ...mockInitialMetadataState,
  loading: true,
  currentCountry: TEST_COUNTRY_US,
};

export const mockLoadedMetadataState: MetadataState = {
  currentCountry: TEST_COUNTRY_US,
  ...DEFAULT_LOADING_STATES,
  loaded: true,
  progress: 100,
  variables: {
    income: {
      name: 'income',
      entity: 'person',
      description: 'Total income',
      label: 'Income',
      unit: 'currency-USD',
    } as VariableMetadata,
    age: {
      name: 'age',
      entity: 'person',
      description: 'Age in years',
      label: 'Age',
      unit: 'year',
    } as VariableMetadata,
  },
  parameters: {
    tax_rate: {
      parameter: 'tax_rate',
      label: 'Tax Rate',
      values: { [CURRENT_YEAR]: 0.25 },
    } as ParameterMetadata,
  },
  datasets: [
    {
      name: `cps_${CURRENT_YEAR}`,
      label: `CPS ${CURRENT_YEAR}`,
      title: `Current Population Survey ${CURRENT_YEAR}`,
      default: true,
    },
  ],
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
    income: {
      name: 'income',
      entity: 'person',
      description: 'Total income',
      label: 'Income',
      unit: 'currency-GBP',
    } as VariableMetadata,
  },
  datasets: [
    {
      name: `frs_${CURRENT_YEAR}`,
      label: `FRS ${CURRENT_YEAR}`,
      title: `Family Resources Survey ${CURRENT_YEAR}`,
      default: true,
    },
  ],
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
