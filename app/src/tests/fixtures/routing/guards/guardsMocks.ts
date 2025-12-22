/**
 * Fixtures for guards tests
 */
import { TEST_COUNTRIES } from '@/tests/fixtures/hooks/metadataHooksMocks';

// Re-export shared constants
export { TEST_COUNTRIES };

// Core metadata states
export const CORE_STATE = {
  INITIAL: {
    coreLoading: false,
    coreLoaded: false,
    coreError: null,
    currentCountry: null,
  },
  LOADING: {
    coreLoading: true,
    coreLoaded: false,
    coreError: null,
    currentCountry: TEST_COUNTRIES.US,
  },
  LOADED: {
    coreLoading: false,
    coreLoaded: true,
    coreError: null,
    currentCountry: TEST_COUNTRIES.US,
  },
  ERROR: {
    coreLoading: false,
    coreLoaded: false,
    coreError: 'Failed to load core metadata',
    currentCountry: TEST_COUNTRIES.US,
  },
} as const;

// Parameters states
export const PARAMETERS_STATE = {
  INITIAL: {
    parametersLoading: false,
    parametersLoaded: false,
    parametersError: null,
  },
  LOADING: {
    parametersLoading: true,
    parametersLoaded: false,
    parametersError: null,
  },
  LOADED: {
    parametersLoading: false,
    parametersLoaded: true,
    parametersError: null,
  },
  ERROR: {
    parametersLoading: false,
    parametersLoaded: false,
    parametersError: 'Failed to load parameters',
  },
} as const;

// Loading page messages
export const LOADING_MESSAGES = {
  CORE: 'Loading metadata...',
  PARAMETERS: 'Loading policy parameters...',
} as const;

// Test child content
export const CHILD_CONTENT = 'Child Route Content';
