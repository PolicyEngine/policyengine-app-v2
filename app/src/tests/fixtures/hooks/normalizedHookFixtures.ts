import { vi } from 'vitest';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { Policy } from '@/types/ingredients/Policy';
import type { Household } from '@/types/ingredients/Household';
import type { Geography } from '@/types/ingredients/Geography';
import type { Report } from '@/types/ingredients/Report';
import type { UserReport } from '@/types/ingredients/UserReport';

/**
 * Test constants for normalized hooks
 */
export const NORMALIZED_HOOK_CONSTANTS = {
  TEST_USER_REPORT_ID: 'sur-test-123',
  TEST_REPORT_ID: 'report-norm-456',
  TEST_SIMULATION_ID_1: 'sim-norm-1',
  TEST_SIMULATION_ID_2: 'sim-norm-2',
  TEST_POLICY_ID_1: 'policy-norm-1',
  TEST_POLICY_ID_2: 'policy-norm-2',
  TEST_HOUSEHOLD_ID: 'household-norm-123',
  TEST_GEOGRAPHY_ID: 'california',
  TEST_USER_ID: 'user-norm-789',
  TEST_COUNTRY_ID: 'us',
} as const;

/**
 * Mock Simulation for normalized hooks
 */
export const mockNormalizedSimulation = (overrides?: Partial<Simulation>): Simulation => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1,
  countryId: 'us',
  apiVersion: '1.0.0',
  policyId: NORMALIZED_HOOK_CONSTANTS.TEST_POLICY_ID_1,
  populationId: NORMALIZED_HOOK_CONSTANTS.TEST_HOUSEHOLD_ID,
  populationType: 'household',
  label: 'Test Simulation',
  isCreated: true,
  ...overrides,
});

/**
 * Mock Policy for normalized hooks
 */
export const mockNormalizedPolicy = (overrides?: Partial<Policy>): Policy => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_POLICY_ID_1,
  countryId: 'us',
  label: 'Test Policy',
  apiVersion: '1.0.0',
  parameters: [],
  isCreated: true,
  ...overrides,
});

/**
 * Mock Household for normalized hooks
 */
export const mockNormalizedHousehold = (overrides?: Partial<Household>): Household => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_HOUSEHOLD_ID,
  countryId: 'us',
  householdData: {
    people: {},
    households: {},
  },
  ...overrides,
});

/**
 * Mock Geography for normalized hooks
 */
export const mockNormalizedGeography = (overrides?: Partial<Geography>): Geography => ({
  id: `us-${NORMALIZED_HOOK_CONSTANTS.TEST_GEOGRAPHY_ID}`,
  countryId: 'us',
  scope: 'subnational',
  geographyId: NORMALIZED_HOOK_CONSTANTS.TEST_GEOGRAPHY_ID,
  name: 'California',
  ...overrides,
});

/**
 * Mock Report for normalized hooks
 */
export const mockNormalizedReport = (overrides?: Partial<Report>): Report => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_REPORT_ID,
  countryId: 'us',
  apiVersion: '1.0.0',
  simulationIds: [
    NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1,
    NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_2,
  ],
  status: 'pending',
  output: null,
  label: 'Test Report',
  ...overrides,
});

/**
 * Mock UserReport for normalized hooks
 */
export const mockNormalizedUserReport = (overrides?: Partial<UserReport>): UserReport => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_USER_REPORT_ID,
  userId: NORMALIZED_HOOK_CONSTANTS.TEST_USER_ID,
  reportId: NORMALIZED_HOOK_CONSTANTS.TEST_REPORT_ID,
  label: 'Test User Report',
  createdAt: Date.now().toString(),
  ...overrides,
});

/**
 * Mock metadata for geography options
 */
export const mockGeographyMetadata = () => ({
  [NORMALIZED_HOOK_CONSTANTS.TEST_GEOGRAPHY_ID]: {
    label: 'California',
    value: NORMALIZED_HOOK_CONSTANTS.TEST_GEOGRAPHY_ID,
  },
});

/**
 * Mock API responses
 */
export const mockSimulationMetadata = () => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1,
  country_id: NORMALIZED_HOOK_CONSTANTS.TEST_COUNTRY_ID,
  policy_id: NORMALIZED_HOOK_CONSTANTS.TEST_POLICY_ID_1,
  household_id: NORMALIZED_HOOK_CONSTANTS.TEST_HOUSEHOLD_ID,
  label: 'Test Simulation',
});

export const mockPolicyMetadata = () => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_POLICY_ID_1,
  country_id: NORMALIZED_HOOK_CONSTANTS.TEST_COUNTRY_ID,
  label: 'Test Policy',
  parameters: [],
});

export const mockHouseholdMetadata = () => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_HOUSEHOLD_ID,
  country_id: NORMALIZED_HOOK_CONSTANTS.TEST_COUNTRY_ID,
  household_data: {
    people: {},
    households: {},
  },
});

export const mockReportMetadata = () => ({
  id: NORMALIZED_HOOK_CONSTANTS.TEST_REPORT_ID,
  country_id: NORMALIZED_HOOK_CONSTANTS.TEST_COUNTRY_ID,
  simulation_ids: [
    NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1,
    NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_2,
  ],
  status: 'pending',
  output: null,
});
