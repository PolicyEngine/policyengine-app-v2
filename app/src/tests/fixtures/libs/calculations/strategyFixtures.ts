import { vi } from 'vitest';
import { SocietyWideCalculationResponse } from '@/api/societyWideCalculation';
import {
  mockHouseholdResult,
  mockSocietyWideResult,
} from '@/tests/fixtures/types/calculationFixtures';
import { Household } from '@/types/ingredients/Household';

/**
 * Test constants for strategy timing and progress
 */
export const STRATEGY_TEST_CONSTANTS = {
  // Refetch intervals (both strategies now use 1s polling)
  SOCIETY_WIDE_REFETCH_INTERVAL_MS: 1000,
  HOUSEHOLD_REFETCH_INTERVAL_MS: 1000,

  // Duration estimates
  HOUSEHOLD_ESTIMATED_DURATION_MS: 60000,
  CUSTOM_ESTIMATED_DURATION_MS: 30000,
  LONG_ESTIMATED_DURATION_MS: 100000,

  // Progress thresholds
  MAX_SYNTHETIC_PROGRESS: 95,
  COMPLETE_PROGRESS: 100,

  // Queue and timing
  TEST_QUEUE_POSITION: 3,
  SOCIETY_WIDE_AVERAGE_TIME_SECONDS: 45,
  SOCIETY_WIDE_AVERAGE_TIME_MS: 45000,

  // Test timing values
  TEST_PROGRESS_TIME_MS: 30000,
} as const;

/**
 * Mock society-wide API response - computing state
 */
export const mockSocietyWideComputingResponse = (): SocietyWideCalculationResponse => ({
  status: 'computing',
  queue_position: STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION,
  average_time: STRATEGY_TEST_CONSTANTS.SOCIETY_WIDE_AVERAGE_TIME_SECONDS,
  result: null,
});

/**
 * Mock society-wide API response - complete state
 */
export const mockSocietyWideCompleteResponse = (): SocietyWideCalculationResponse => ({
  status: 'ok',
  result: mockSocietyWideResult(),
  queue_position: undefined,
  average_time: undefined,
});

/**
 * Mock society-wide API response - error state
 */
export const mockSocietyWideErrorResponse = (): SocietyWideCalculationResponse => ({
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
export const mockHouseholdSuccessResponse = (): Household => mockHouseholdResult();

/**
 * Mock fetch functions
 */
export const createMockFetchSocietyWideCalculation = () => {
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
