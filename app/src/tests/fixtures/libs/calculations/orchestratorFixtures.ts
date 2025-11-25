import { CalcStartConfig, CalcStatus } from '@/types/calculation';

/**
 * Test constants for orchestrator cleanup tests
 */
export const ORCHESTRATOR_TEST_CONSTANTS = {
  CALC_IDS: {
    REPORT: 'test-report-123',
    SIMULATION: 'test-sim-456',
  },
  COUNTRY_IDS: {
    US: 'us',
    UK: 'uk',
  },
} as const;

/**
 * Create mock calculation config for testing
 */
export const createMockCalcConfig = (overrides?: Partial<CalcStartConfig>): CalcStartConfig => ({
  calcId: ORCHESTRATOR_TEST_CONSTANTS.CALC_IDS.REPORT,
  targetType: 'report',
  countryId: ORCHESTRATOR_TEST_CONSTANTS.COUNTRY_IDS.US,
  year: '2024',
  simulations: {
    simulation1: {
      id: 'sim-1',
      label: 'Baseline',
      populationType: 'geography',
      populationId: 'us',
      isCreated: true,
    },
    simulation2: null,
  },
  populations: {
    household1: null,
    household2: null,
    geography1: {
      id: 'us-us',
      countryId: ORCHESTRATOR_TEST_CONSTANTS.COUNTRY_IDS.US,
      scope: 'national',
      geographyId: 'us',
    },
    geography2: null,
  },
  ...overrides,
});

/**
 * Create mock complete CalcStatus
 */
export const createMockCompleteStatus = (calcId: string): CalcStatus => ({
  status: 'complete',
  result: {
    budget: {
      budgetary_impact: 1000,
    },
  } as any,
  metadata: {
    calcId,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
});

/**
 * Create mock error CalcStatus
 */
export const createMockErrorStatus = (calcId: string): CalcStatus => ({
  status: 'error',
  error: {
    message: 'Test calculation error',
    code: 'CALCULATION_FAILED',
    retryable: false,
  },
  metadata: {
    calcId,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
});

/**
 * Create mock computing CalcStatus
 */
export const createMockComputingStatus = (calcId: string, progress: number = 50): CalcStatus => ({
  status: 'pending',
  progress,
  message: 'Computing...',
  metadata: {
    calcId,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
});
