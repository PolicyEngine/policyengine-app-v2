import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

// Test IDs
export const TEST_IDS = {
  USER_ID: 'test-user-123',
  HOUSEHOLD_ID: 'household-456',
  USER_HOUSEHOLD_ID: 'suh-abc123def4',
  GEOGRAPHY_ID: 'state/ca',
  GEOGRAPHY_ID_UK: 'constituency/Sheffield Central',
  POLICY_ID: '12345',
  USER_POLICY_ID: 'sup-xyz789abc1',
  SIMULATION_ID: '67890',
  USER_SIMULATION_ID: 'sus-mno456pqr7',
  REPORT_ID: '11223',
  USER_REPORT_ID: 'sur-stu901vwx2',
} as const;

// Test labels
export const TEST_LABELS = {
  ORIGINAL: 'Original Label',
  UPDATED: 'Updated Label',
  HOUSEHOLD: 'My Test Household',
  GEOGRAPHY: 'My Test Geography',
  POLICY: 'My Test Policy',
  SIMULATION: 'My Test Simulation',
  REPORT: 'My Test Report',
} as const;

// Test countries
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// Test timestamps
export const TEST_TIMESTAMPS = {
  CREATED_AT: '2024-01-15T10:00:00.000Z',
  UPDATED_AT: '2024-01-15T12:00:00.000Z',
} as const;

// Mock UserHouseholdPopulation
export const createMockHouseholdAssociation = (
  overrides?: Partial<UserHouseholdPopulation>
): UserHouseholdPopulation => ({
  type: 'household',
  id: TEST_IDS.USER_HOUSEHOLD_ID,
  userId: TEST_IDS.USER_ID,
  householdId: TEST_IDS.HOUSEHOLD_ID,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.HOUSEHOLD,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  isCreated: true,
  ...overrides,
});

// Mock UserGeographyPopulation
export const createMockGeographyAssociation = (
  overrides?: Partial<UserGeographyPopulation>
): UserGeographyPopulation => ({
  type: 'geography',
  userId: TEST_IDS.USER_ID,
  geographyId: TEST_IDS.GEOGRAPHY_ID,
  countryId: TEST_COUNTRIES.US,
  scope: 'subnational',
  label: TEST_LABELS.GEOGRAPHY,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  ...overrides,
});

// Mock UserPolicy
export const createMockPolicyAssociation = (overrides?: Partial<UserPolicy>): UserPolicy => ({
  id: TEST_IDS.USER_POLICY_ID,
  userId: TEST_IDS.USER_ID,
  policyId: TEST_IDS.POLICY_ID,
  label: TEST_LABELS.POLICY,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  isCreated: true,
  ...overrides,
});

// Mock UserSimulation
export const createMockSimulationAssociation = (
  overrides?: Partial<UserSimulation>
): UserSimulation => ({
  id: TEST_IDS.USER_SIMULATION_ID,
  userId: TEST_IDS.USER_ID,
  simulationId: TEST_IDS.SIMULATION_ID,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.SIMULATION,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  isCreated: true,
  ...overrides,
});

// Mock UserReport
export const createMockReportAssociation = (overrides?: Partial<UserReport>): UserReport => ({
  id: TEST_IDS.USER_REPORT_ID,
  userId: TEST_IDS.USER_ID,
  reportId: TEST_IDS.REPORT_ID,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.REPORT,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  isCreated: true,
  ...overrides,
});

// Error messages
export const ERROR_MESSAGES = {
  HOUSEHOLD_NOT_FOUND: (id: string) => `UserHousehold with id ${id} not found`,
  GEOGRAPHY_NOT_FOUND: (userId: string, geographyId: string) =>
    `UserGeography with userId ${userId} and geographyId ${geographyId} not found`,
  POLICY_NOT_FOUND: (id: string) => `UserPolicy with id ${id} not found`,
  SIMULATION_NOT_FOUND: (id: string) => `UserSimulation with id ${id} not found`,
  REPORT_NOT_FOUND: (id: string) => `UserReport with id ${id} not found`,
  API_NOT_SUPPORTED: 'Please ensure you are using localStorage mode',
} as const;
