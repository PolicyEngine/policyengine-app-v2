import type { CalcStatus } from '@/types/calculation';

/**
 * Test constants for useAggregatedCalculationStatus tests
 */

export const TEST_SIM_IDS = {
  SIM_1: 'sim-1',
  SIM_2: 'sim-2',
  SIM_3: 'sim-3',
} as const;

export const TEST_REPORT_IDS = {
  REPORT_1: 'report-1',
  REPORT_2: 'report-2',
} as const;

// Helper to create metadata for tests
export const createTestMetadata = (
  calcId: string,
  calcType: 'household' | 'societyWide' = 'household',
  targetType: 'simulation' | 'report' = 'simulation'
): CalcStatus['metadata'] => ({
  calcId,
  calcType,
  targetType,
  startedAt: Date.now(),
});
