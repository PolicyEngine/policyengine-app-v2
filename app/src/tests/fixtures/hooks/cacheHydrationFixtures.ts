import { CalcStatus } from '@/types/calculation';
import { ReportMetadata } from '@/types/metadata/reportMetadata';

/**
 * Test constants for cache hydration tests
 */
export const CACHE_HYDRATION_TEST_CONSTANTS = {
  REPORT_IDS: {
    WITH_OUTPUT: 'report-with-output-123',
    WITHOUT_OUTPUT: 'report-without-output-456',
    COMPUTING: 'report-computing-789',
  },
  COUNTRY_IDS: {
    US: 'us',
    UK: 'uk',
  },
} as const;

/**
 * Create mock report with output (completed calculation)
 */
export const createMockReportWithOutput = (
  overrides?: Partial<ReportMetadata>
): ReportMetadata => ({
  id: 123,
  country_id: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
  simulation_1_id: 'sim-1',
  simulation_2_id: 'sim-2',
  api_version: '1.0.0',
  status: 'complete',
  output: JSON.stringify({
    // Mock economy output
    budget: {
      budgetary_impact: 1000,
    },
    earnings: {
      total_earnings: 50000,
    },
  }),
  ...overrides,
});

/**
 * Create mock report without output (incomplete calculation)
 */
export const createMockReportWithoutOutput = (
  overrides?: Partial<ReportMetadata>
): ReportMetadata => ({
  id: 456,
  country_id: CACHE_HYDRATION_TEST_CONSTANTS.COUNTRY_IDS.US,
  simulation_1_id: 'sim-1',
  simulation_2_id: null,
  api_version: '1.0.0',
  status: 'pending',
  output: null,
  ...overrides,
});

/**
 * Create mock CalcStatus for testing
 */
export const createMockCalcStatusComplete = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: {
    budget: {
      budgetary_impact: 1000,
    },
  } as any,
  metadata: {
    calcId: CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.WITH_OUTPUT,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Create mock CalcStatus computing
 */
export const createMockCalcStatusComputing = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'pending',
  progress: 50,
  message: 'Computing...',
  metadata: {
    calcId: CACHE_HYDRATION_TEST_CONSTANTS.REPORT_IDS.COMPUTING,
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  },
  ...overrides,
});
