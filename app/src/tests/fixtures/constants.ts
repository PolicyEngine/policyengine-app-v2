import { CURRENT_YEAR } from '@/constants';
import type { CountryId } from '@/libs/countries';

/**
 * Test constants for use across all test files
 * These constants provide consistent, descriptive values for testing
 */

// Re-export CURRENT_YEAR for use in other test files
export { CURRENT_YEAR };

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

/**
 * A country code the app no longer serves (Canada), typed as a country ID
 * to exercise the runtime guards that handle a country from a URL or
 * storage that has no saved-work support.
 */
export const UNSUPPORTED_COUNTRY_ID = TEST_COUNTRIES.CA as string as CountryId;

export const TEST_USER_IDS = {
  USER_123: 'user-123',
  USER_456: 'user-456',
} as const;

export const TEST_POLICY_IDS = {
  POLICY_789: 'policy-789',
  POLICY_ABC: 'policy-abc',
} as const;

export const TEST_SIMULATION_IDS = {
  SIM_DEF: 'sim-def',
  SIM_GHI: 'sim-ghi',
} as const;

export const TEST_REPORT_IDS = {
  REPORT_JKL: 'report-jkl',
  REPORT_MNO: 'report-mno',
} as const;

export const TEST_LABELS = {
  MY_POLICY: 'My Test Policy',
  MY_SIMULATION: 'My Test Simulation',
  MY_REPORT: 'My Test Report',
} as const;

export const TEST_TIMESTAMPS = {
  CREATED_AT: `${CURRENT_YEAR}-01-15T10:00:00Z`,
  UPDATED_AT: `${CURRENT_YEAR}-01-15T12:00:00Z`,
} as const;
