import { vi } from 'vitest';
import type { UserReport } from '@/types/ingredients/UserReport';

/**
 * Test constants for user IDs
 */
export const TEST_USER_IDS = {
  USER_123: 'user-123',
} as const;

/**
 * Test constants for report IDs
 */
export const TEST_REPORT_IDS = {
  REPORT_456: 'report-456',
  REPORT_789: 'report-789',
} as const;

/**
 * Test constants for simulation IDs
 */
export const TEST_SIM_IDS = {
  SIM_1: 'sim-1',
  SIM_2: 'sim-2',
  SIM_3: 'sim-3',
} as const;

/**
 * Test constants for user report IDs
 */
export const TEST_USER_REPORT_IDS = {
  SUR_ABC123: 'sur-abc123',
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
  TEST_REPORT_1: 'Test Report 1',
  TEST_REPORT_2: 'Test Report 2',
} as const;

/**
 * Mock UserReport input (without id and createdAt)
 */
export const mockReportInput = (overrides?: Partial<Omit<UserReport, 'id' | 'createdAt'>>): Omit<UserReport, 'id' | 'createdAt'> => ({
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_456,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.TEST_REPORT_1,
  simulationIds: [TEST_SIM_IDS.SIM_1, TEST_SIM_IDS.SIM_2],
  isCreated: true,
  ...overrides,
});

/**
 * Mock UserReport with id and createdAt
 */
export const mockReport = (overrides?: Partial<UserReport>): UserReport => ({
  ...mockReportInput(),
  id: TEST_USER_REPORT_IDS.SUR_ABC123,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Mock API response for UserReport
 */
export const mockReportApiResponse = (overrides?: any) => ({
  id: TEST_USER_REPORT_IDS.SUR_ABC123,
  user_id: TEST_USER_IDS.USER_123,
  report_id: TEST_REPORT_IDS.REPORT_456,
  country_id: TEST_COUNTRIES.US,
  label: TEST_LABELS.TEST_REPORT_1,
  simulation_ids: [TEST_SIM_IDS.SIM_1, TEST_SIM_IDS.SIM_2],
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

// Convenience exports for common test values
export const TEST_USER_ID = TEST_USER_IDS.USER_123;
export const TEST_REPORT_ID = 'report-123'; // Used in useUserReports tests
export const TEST_LABEL = TEST_LABELS.TEST_REPORT_1;
export const TEST_TIMESTAMP = '2025-01-01T00:00:00Z';

/**
 * Mock list of UserReports for testing
 */
export const mockUserReportList: UserReport[] = [
  {
    id: 'user-report-1',
    userId: TEST_USER_ID,
    reportId: 'report-1',
    label: 'Test Report 1',
    createdAt: TEST_TIMESTAMP,
    updatedAt: TEST_TIMESTAMP,
    isCreated: true,
  },
  {
    id: 'user-report-2',
    userId: TEST_USER_ID,
    reportId: 'report-2',
    label: 'Test Report 2',
    createdAt: TEST_TIMESTAMP,
    updatedAt: TEST_TIMESTAMP,
    isCreated: true,
  },
];
