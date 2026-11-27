import { vi } from 'vitest';
import {
  EconomyCalculationError,
  SocietyWideCalculationResponse,
} from '@/api/societyWideCalculation';
import {
  economyCalculationError,
  FAILED_CALCULATION_BODY,
} from '@/tests/fixtures/api/societyWideMocks';
import {
  mockHouseholdResult,
  mockSocietyWideResult,
} from '@/tests/fixtures/types/calculationFixtures';
import type { CalcStatus } from '@/types/calculation';
import type { HouseholdCalculationData } from '@/types/calculation/household';

/**
 * Test constants for strategy timing and progress
 */
export const STRATEGY_TEST_CONSTANTS = {
  // Refetch intervals
  SOCIETY_WIDE_REFETCH_INTERVAL_MS: 1000,
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

/** A society-wide report run's status as last polled: computing, 40% along, third in the queue. */
export const mockComputingSocietyWideStatus = (
  overrides: Partial<CalcStatus> = {}
): CalcStatus => ({
  status: 'pending',
  progress: 40,
  queuePosition: STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION,
  message: `In queue (position ${STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION})...`,
  metadata: {
    calcId: 'test-report',
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now() - STRATEGY_TEST_CONSTANTS.TEST_PROGRESS_TIME_MS,
  },
  ...overrides,
});

/** The message of a request that failed on the network, as the browser's fetch rejects. */
export const NETWORK_ERROR_MESSAGE = 'Failed to fetch';

/**
 * Failed requests, which a computing run outlasts because its job may still
 * run: a network error, a gateway's 5xx page, and the 5xx answers the
 * calculator's route writes itself when the Public API cannot be reached or
 * does not answer in time.
 */
export const FAILED_REQUEST_ERRORS: Array<[string, Error]> = [
  ['a network error', new TypeError(NETWORK_ERROR_MESSAGE)],
  ['a gateway 502 page', economyCalculationError(502, null)],
  ['a 503', economyCalculationError(503, null)],
  [
    'a 502 the route wrote because the Public API could not be reached',
    new EconomyCalculationError(
      'Society-wide calculation failed (502)',
      502,
      { status: 'error', message: 'The Public API could not be reached.', result: null },
      true
    ),
  ],
  [
    'a 504 the route wrote because the Public API did not answer in time',
    new EconomyCalculationError(
      'Society-wide calculation failed (504)',
      504,
      { status: 'error', message: 'The Public API did not answer in time.', result: null },
      true
    ),
  ],
];

/** The Public API's answer for a calculation it ran and that failed: 502 with its error body. */
export const FAILED_CALCULATION_ERROR = economyCalculationError(502, FAILED_CALCULATION_BODY);

/** Requests the Public API refused, which no later poll would answer differently. */
export const REFUSED_REQUEST_ERRORS: Array<[string, Error]> = [
  [
    'a 404',
    economyCalculationError(404, { status: 'error', message: 'Policy not found', result: null }),
  ],
  [
    'a 422',
    economyCalculationError(422, { status: 'error', message: 'Invalid region', result: null }),
  ],
];

/**
 * Mock household API response (successful)
 * Note: Household API returns data directly, not a status object
 */
export const mockHouseholdSuccessResponse = (): HouseholdCalculationData => mockHouseholdResult();

/**
 * Mock fetch functions
 */
export const createMockFetchSocietyWideCalculation = () => {
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
