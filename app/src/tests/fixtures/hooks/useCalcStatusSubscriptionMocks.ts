import type { CalcStatus } from '@/types/calculation';

/**
 * Test constants for useCalcStatusSubscription hooks
 */

export const TEST_SIMULATION_IDS = {
  SIM_1: 'sim-1',
  SIM_2: 'sim-2',
  SIM_3: 'sim-3',
  SIM_123: 'sim-123',
} as const;

export const TEST_REPORT_IDS = {
  REPORT_123: 'report-123',
  REPORT_456: 'report-456',
  REPORT_789: 'report-789',
  REPORT_999: 'report-999',
  REPORT_CAP: 'report-cap',
  REPORT_ERROR: 'report-error',
} as const;

export const TEST_PROGRESS_VALUES = {
  LOW: 45,
  MEDIUM: 60,
  HIGH: 75,
  CAPPED: 95,
  WITH_DECIMAL: 95.4,
} as const;

/**
 * Helper to create a mock pending CalcStatus
 */
export function createMockPendingStatus(
  calcId: string,
  calcType: 'household' | 'societyWide' = 'household',
  progress?: number,
  message?: string
): CalcStatus {
  return {
    status: 'pending',
    ...(progress !== undefined && { progress }),
    ...(message && { message }),
    metadata: {
      calcId,
      calcType,
      targetType: calcType === 'household' ? 'simulation' : 'report',
      startedAt: Date.now(),
    },
  };
}

/**
 * Helper to create a mock complete CalcStatus
 */
export function createMockCompleteStatus(
  calcId: string,
  calcType: 'household' | 'societyWide' = 'household',
  result: any = {}
): CalcStatus {
  return {
    status: 'complete',
    result,
    metadata: {
      calcId,
      calcType,
      targetType: calcType === 'household' ? 'simulation' : 'report',
      startedAt: Date.now(),
    },
  };
}

/**
 * Helper to create a mock error CalcStatus
 */
export function createMockErrorStatus(
  calcId: string,
  calcType: 'household' | 'societyWide' = 'household',
  errorMessage: string = 'Calculation failed'
): CalcStatus {
  return {
    status: 'error',
    error: {
      code: calcType === 'societyWide' ? 'SOCIETY_WIDE_CALC_ERROR' : 'HOUSEHOLD_CALC_ERROR',
      message: errorMessage,
      retryable: true,
    },
    metadata: {
      calcId,
      calcType,
      targetType: calcType === 'household' ? 'simulation' : 'report',
      startedAt: Date.now(),
    },
  };
}
