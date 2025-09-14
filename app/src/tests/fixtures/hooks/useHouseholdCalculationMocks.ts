import { vi } from 'vitest';

// Test constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  EXISTING: '12345',
  NON_EXISTENT: '99999',
  LARGE_HOUSEHOLD: '67890',
} as const;

export const TEST_POLICY_IDS = {
  BASELINE: 'baseline-001',
  REFORM: 'reform-002',
  INVALID: 'invalid-999',
} as const;

// Mock callback functions
export const mockOnSuccess = vi.fn();
export const mockOnError = vi.fn();

// Error messages
export const ERROR_MESSAGES = {
  TIMEOUT: 'Household calculation timed out after 50 seconds (client-side timeout)',
  NETWORK_ERROR: 'Network error',
  API_ERROR: 'Household calculation failed',
} as const;
