/**
 * Fixtures for guards tests
 */
import { TEST_COUNTRIES } from '@/tests/fixtures/hooks/metadataHooksMocks';

// Re-export shared constants
export { TEST_COUNTRIES };

// Metadata states (unified loading)
export const METADATA_STATE = {
  INITIAL: {
    loading: false,
    loaded: false,
    error: null,
    currentCountry: null,
  },
  LOADING: {
    loading: true,
    loaded: false,
    error: null,
    currentCountry: TEST_COUNTRIES.US,
  },
  LOADED: {
    loading: false,
    loaded: true,
    error: null,
    currentCountry: TEST_COUNTRIES.US,
  },
  ERROR: {
    loading: false,
    loaded: false,
    error: 'Failed to load metadata',
    currentCountry: TEST_COUNTRIES.US,
  },
} as const;

// Loading page messages
export const LOADING_MESSAGES = {
  METADATA: 'Loading metadata...',
} as const;

// Test child content
export const CHILD_CONTENT = 'Child Route Content';
