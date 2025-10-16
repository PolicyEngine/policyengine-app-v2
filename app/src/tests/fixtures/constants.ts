import { CURRENT_YEAR } from '@/constants';

/**
 * Test constants for use across all test files
 * These constants provide consistent, descriptive values for testing
 */

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

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
