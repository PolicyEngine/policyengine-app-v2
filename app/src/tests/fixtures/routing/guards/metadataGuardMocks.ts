import { vi } from 'vitest';

/**
 * Test fixtures for MetadataGuard component
 */

export const MOCK_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const MOCK_METADATA_STATES = {
  LOADING: {
    loading: true,
    error: null,
    version: null,
    countryId: MOCK_COUNTRIES.US,
    currentCountry: MOCK_COUNTRIES.US,
    variables: {},
    entities: {},
    parameters: {},
    variableModules: {},
    economy_options: { region: [], time_period: [], dataset: [] },
  },
  LOADED: {
    loading: false,
    error: null,
    version: '1.0.0',
    countryId: MOCK_COUNTRIES.US,
    currentCountry: MOCK_COUNTRIES.US,
    variables: {},
    entities: {},
    parameters: {},
    variableModules: {},
    economy_options: { region: [], time_period: [], dataset: [] },
  },
  ERROR: {
    loading: false,
    error: 'Failed to load metadata',
    version: null,
    countryId: MOCK_COUNTRIES.US,
    currentCountry: MOCK_COUNTRIES.US,
    variables: {},
    entities: {},
    parameters: {},
    variableModules: {},
    economy_options: { region: [], time_period: [], dataset: [] },
  },
  UNINITIALIZED: {
    loading: false,
    error: null,
    version: null,
    countryId: MOCK_COUNTRIES.US,
    currentCountry: MOCK_COUNTRIES.US,
    variables: {},
    entities: {},
    parameters: {},
    variableModules: {},
    economy_options: { region: [], time_period: [], dataset: [] },
  },
} as const;

export const TEST_MESSAGES = {
  LOADING: 'Loading metadata...',
  ERROR_TITLE: 'Calculation Failed',
} as const;

// Mock hook return values
export const mockUseFetchMetadata = vi.fn();
export const mockUseCurrentCountry = vi.fn(() => MOCK_COUNTRIES.US);
