import { vi } from 'vitest';
import { EconomyCalculationResponse } from '@/api/economy';
import { HouseholdData } from '@/types/ingredients/Household';
import { mockEconomyResult, mockHouseholdResult } from '@/tests/fixtures/types/calculationFixtures';

/**
 * Test constants for strategy timing and progress
 */
export const STRATEGY_TEST_CONSTANTS = {
  // Refetch intervals
  ECONOMY_REFETCH_INTERVAL_MS: 1000,
  HOUSEHOLD_REFETCH_INTERVAL_MS: 500,

  // Duration estimates
  HOUSEHOLD_ESTIMATED_DURATION_MS: 60000,
  CUSTOM_ESTIMATED_DURATION_MS: 30000,
  LONG_ESTIMATED_DURATION_MS: 100000,

  // Progress thresholds
  MAX_SYNTHETIC_PROGRESS: 95,
  COMPLETE_PROGRESS: 100,

  // Queue and timing
  TEST_QUEUE_POSITION: 3,
  ECONOMY_AVERAGE_TIME_SECONDS: 45,
  ECONOMY_AVERAGE_TIME_MS: 45000,

  // Test timing values
  TEST_PROGRESS_TIME_MS: 30000,
} as const;

/**
 * Mock economy API response - computing state
 */
export const mockEconomyComputingResponse = (): EconomyCalculationResponse => ({
  status: 'computing',
  queue_position: STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION,
  average_time: STRATEGY_TEST_CONSTANTS.ECONOMY_AVERAGE_TIME_SECONDS,
  result: null,
});

/**
 * Mock economy API response - complete state
 */
export const mockEconomyCompleteResponse = (): EconomyCalculationResponse => ({
  status: 'ok',
  result: mockEconomyResult(),
  queue_position: undefined,
  average_time: undefined,
});

/**
 * Mock economy API response - error state
 */
export const mockEconomyErrorResponse = (): EconomyCalculationResponse => ({
  status: 'error',
  error: 'Calculation failed due to invalid parameters',
  result: null,
  queue_position: undefined,
  average_time: undefined,
});

/**
 * Mock household API response (successful)
 * Note: Household API returns data directly, not a status object
 */
export const mockHouseholdSuccessResponse = (): HouseholdData => mockHouseholdResult();

/**
 * Mock fetch functions
 */
export const createMockFetchEconomyCalculation = () => {
  return vi.fn();
};

export const createMockFetchHouseholdCalculation = () => {
  return vi.fn();
};

/**
 * Mock ProgressTracker
 */
export const createMockProgressTracker = () => ({
  register: vi.fn(),
  getProgress: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  isActive: vi.fn().mockReturnValue(false),
});
