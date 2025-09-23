/**
 * Test fixtures for countryLoader tests
 */

// Test constants for countries
export const VALID_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  NG: 'ng',
  IL: 'il',
} as const;

export const INVALID_COUNTRY = 'invalid';
export const DEFAULT_COUNTRY = 'us';

// Test paths
export const TEST_PATHS = {
  ROOT: '/',
  US_ROOT: '/us',
  UK_ROOT: '/uk',
  INVALID_ROOT: '/invalid',
  INVALID_POLICIES: '/invalid/policies',
  INVALID_REPORTS: '/invalid/reports/123',
  CONFIGURATIONS: '/configurations',
} as const;

// Mock loader params
export const MOCK_PARAMS = {
  VALID_US: { countryId: VALID_COUNTRIES.US },
  VALID_UK: { countryId: VALID_COUNTRIES.UK },
  INVALID: { countryId: INVALID_COUNTRY },
  CONFIGURATIONS: { countryId: 'configurations' },
  EMPTY: {},
} as const;

// Expected redirect paths
export const EXPECTED_REDIRECTS = {
  US_POLICIES: '/us/policies',
  US_REPORTS: '/us/reports/123',
  US_ROOT: '/us',
  US_WITH_SLASH: '/us/',
} as const;

// Mock redirect response
export const createMockRedirectResponse = (location: string) => ({
  type: 'redirect',
  status: 302,
  location,
});
