import { vi } from 'vitest';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * Test constants for user IDs
 */
export const TEST_USER_IDS = {
  USER_123: 'user-123',
} as const;

/**
 * Test constants for simulation IDs
 */
export const TEST_SIM_IDS = {
  SIM_456: 'sim-456',
  SIM_999: 'sim-999',
} as const;

/**
 * Test constants for policy IDs
 */
export const TEST_POLICY_IDS = {
  POLICY_789: 'policy-789',
  POLICY_111: 'policy-111',
} as const;

/**
 * Test constants for countries
 */
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

/**
 * Test constants for labels
 */
export const TEST_LABELS = {
  TEST_SIMULATION_1: 'Test Simulation 1',
  TEST_SIMULATION_2: 'Test Simulation 2',
} as const;

/**
 * Mock UserSimulation input (without id and createdAt)
 */
export const mockSimulationInput = (
  overrides?: Partial<Omit<UserSimulation, 'id' | 'createdAt'>>
): Omit<UserSimulation, 'id' | 'createdAt'> => ({
  userId: TEST_USER_IDS.USER_123,
  simulationId: TEST_SIM_IDS.SIM_456,
  label: TEST_LABELS.TEST_SIMULATION_1,
  isCreated: true,
  ...overrides,
});

/**
 * Mock UserSimulation with id and createdAt
 */
export const mockSimulation = (overrides?: Partial<UserSimulation>): UserSimulation => ({
  ...mockSimulationInput(),
  id: TEST_SIM_IDS.SIM_456,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock API response for UserSimulation
 */
export const mockSimulationApiResponse = (overrides?: any) => ({
  id: TEST_SIM_IDS.SIM_456,
  user_id: TEST_USER_IDS.USER_123,
  simulation_id: TEST_SIM_IDS.SIM_456,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  country_id: TEST_COUNTRIES.US,
  label: TEST_LABELS.TEST_SIMULATION_1,
  population_type: 'geography',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock fetch response for successful API call
 */
export const mockSuccessFetchResponse = (data: any) => ({
  ok: true,
  json: vi.fn().mockResolvedValue(data),
});

/**
 * Mock fetch response for error
 */
export const mockErrorFetchResponse = (status: number) => ({
  ok: false,
  status,
});
