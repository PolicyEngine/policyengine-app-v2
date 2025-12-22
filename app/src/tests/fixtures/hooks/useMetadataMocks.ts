import { CURRENT_YEAR } from '@/constants';
import { MetadataState } from '@/types/metadata';
import { DEFAULT_V2_LOADING_STATES } from '../reducers/metadataReducerMocks';

// Test country IDs
export const TEST_COUNTRY_US = 'us';
export const TEST_COUNTRY_UK = 'uk';
export const TEST_COUNTRY_CA = 'ca';

// Test error message
export const TEST_ERROR_MESSAGE = 'Previous fetch failed';

// Mock metadata states (only API-driven data, not static data)
export const mockInitialMetadataState: MetadataState = {
  currentCountry: null,
  ...DEFAULT_V2_LOADING_STATES,
  progress: 0,
  variables: {},
  parameters: {},
  datasets: [],
  version: null,
  parameterTree: null,
};

export const mockLoadingMetadataState: MetadataState = {
  ...mockInitialMetadataState,
  coreLoading: true,
  currentCountry: TEST_COUNTRY_US,
};

export const mockLoadedMetadataState: MetadataState = {
  currentCountry: TEST_COUNTRY_US,
  ...DEFAULT_V2_LOADING_STATES,
  coreLoaded: true,
  parametersLoaded: true,
  progress: 100,
  variables: {
    income: { label: 'Income', unit: 'currency-USD' },
    age: { label: 'Age', unit: 'year' },
  },
  parameters: {
    tax_rate: { label: 'Tax Rate', values: { [CURRENT_YEAR]: 0.25 } },
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
    income: { label: 'Income', unit: 'currency-GBP' },
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
  coreError: TEST_ERROR_MESSAGE,
  currentCountry: TEST_COUNTRY_US,
};
