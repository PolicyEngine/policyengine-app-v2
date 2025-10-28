import type { Report } from '@/types/ingredients/Report';

/**
 * Test constants for ReportOutputTypeCell component
 */

export const TEST_REPORT_IDS = {
  REPORT_123: 'report-123',
  REPORT_456: 'report-456',
  REPORT_789: 'report-789',
  REPORT_999: 'report-999',
  REPORT_NO_CACHE: 'report-no-cache',
  REPORT_CAP: 'report-cap',
  REPORT_ERROR: 'report-error',
} as const;

export const TEST_SIMULATION_IDS = {
  SIM_1: 'sim-1',
  SIM_2: 'sim-2',
} as const;

export const TEST_PROGRESS_VALUES = {
  LOW: 42,
  HIGH: 95.4,
} as const;

export const TEST_COUNTRY = {
  US: 'us',
} as const;

export const TEST_API_VERSION = '1.0.0';

/**
 * Helper to create a mock Report with output
 */
export function createMockReportWithOutput(
  reportId: string,
  countryId: string = TEST_COUNTRY.US
): Report {
  return {
    id: reportId,
    countryId,
    apiVersion: TEST_API_VERSION,
    simulationIds: [TEST_SIMULATION_IDS.SIM_1, TEST_SIMULATION_IDS.SIM_2],
    status: 'complete',
    output: { some: 'economy data' } as any,
  } as Report;
}

/**
 * Helper to create a mock Report without output
 */
export function createMockReportWithoutOutput(
  reportId: string,
  countryId: string = TEST_COUNTRY.US
): Report {
  return {
    id: reportId,
    countryId,
    apiVersion: TEST_API_VERSION,
    simulationIds: [TEST_SIMULATION_IDS.SIM_1, TEST_SIMULATION_IDS.SIM_2],
    status: 'complete',
  } as Report;
}
