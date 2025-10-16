import { QueryClient } from '@tanstack/react-query';
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
export const mockReportInput = (
  overrides?: Partial<Omit<UserReport, 'id' | 'createdAt'>>
): Omit<UserReport, 'id' | 'createdAt'> => ({
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_456,
  label: TEST_LABELS.TEST_REPORT_1,
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
export const TEST_REPORT_ID = '123'; // Used in useUserReports tests - matches adapted report ID from metadata
export const TEST_LABEL = TEST_LABELS.TEST_REPORT_1;
export const TEST_TIMESTAMP = '2025-01-01T00:00:00Z';

/**
 * Mock single UserReport for testing
 */
export const mockUserReport: UserReport = {
  id: 'user-report-1',
  userId: TEST_USER_ID,
  reportId: TEST_REPORT_ID,
  countryId: 'us',
  label: TEST_LABEL,
  createdAt: TEST_TIMESTAMP,
  updatedAt: TEST_TIMESTAMP,
  isCreated: true,
};

/**
 * Mock list of UserReports for testing
 */
export const mockUserReportList: UserReport[] = [
  mockUserReport,
  {
    id: 'user-report-2',
    userId: TEST_USER_ID,
    reportId: 'report-1',
    countryId: 'us',
    label: 'First Report',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'user-report-3',
    userId: TEST_USER_ID,
    reportId: 'report-2',
    countryId: 'us',
    label: 'Second Report',
    createdAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    isCreated: true,
  },
];

// Multi-country mock data for testing country filtering
export const mockMultiCountryReportList: UserReport[] = [
  {
    id: 'report-us-1',
    userId: TEST_USER_ID,
    reportId: 'report-us-1',
    countryId: TEST_COUNTRIES.US,
    label: 'US Report 1',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-us-2',
    userId: TEST_USER_ID,
    reportId: 'report-us-2',
    countryId: TEST_COUNTRIES.US,
    label: 'US Report 2',
    createdAt: `${CURRENT_YEAR}-01-11T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-11T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-uk-1',
    userId: TEST_USER_ID,
    reportId: 'report-uk-1',
    countryId: TEST_COUNTRIES.UK,
    label: 'UK Report 1',
    createdAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-ca-1',
    userId: TEST_USER_ID,
    reportId: 'report-ca-1',
    countryId: TEST_COUNTRIES.CA,
    label: 'CA Report 1',
    createdAt: `${CURRENT_YEAR}-01-13T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-13T10:00:00Z`,
    isCreated: true,
  },
];

export const mockMultiCountryApiResponses = mockMultiCountryReportList.map((report) => ({
  reportId: report.reportId,
  userId: report.userId,
  countryId: report.countryId,
  label: report.label,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
}));

// Multi-country mock data for testing country filtering
export const mockMultiCountryReportList: UserReport[] = [
  {
    id: 'report-us-1',
    userId: TEST_USER_ID,
    reportId: 'report-us-1',
    countryId: TEST_COUNTRIES.US,
    label: 'US Report 1',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-us-2',
    userId: TEST_USER_ID,
    reportId: 'report-us-2',
    countryId: TEST_COUNTRIES.US,
    label: 'US Report 2',
    createdAt: `${CURRENT_YEAR}-01-11T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-11T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-uk-1',
    userId: TEST_USER_ID,
    reportId: 'report-uk-1',
    countryId: TEST_COUNTRIES.UK,
    label: 'UK Report 1',
    createdAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-ca-1',
    userId: TEST_USER_ID,
    reportId: 'report-ca-1',
    countryId: TEST_COUNTRIES.CA,
    label: 'CA Report 1',
    createdAt: `${CURRENT_YEAR}-01-13T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-13T10:00:00Z`,
    isCreated: true,
  },
];

export const mockMultiCountryApiResponses = mockMultiCountryReportList.map((report) => ({
  reportId: report.reportId,
  userId: report.userId,
  countryId: report.countryId,
  label: report.label,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
}));

export const mockApiResponse = {
  reportId: TEST_REPORT_ID,
  userId: TEST_USER_ID,
  label: TEST_LABEL,
  createdAt: TEST_TIMESTAMP,
  updatedAt: TEST_TIMESTAMP,
};

export const mockApiResponseList = [
  {
    reportId: 'report-1',
    userId: TEST_USER_ID,
    label: 'First Report',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
  },
  {
    reportId: 'report-2',
    userId: TEST_USER_ID,
    label: 'Second Report',
    createdAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
  },
];

export const mockCreationPayload = {
  userId: TEST_USER_ID,
  reportId: TEST_REPORT_ID,
  label: TEST_LABEL,
  updatedAt: TEST_TIMESTAMP,
};

// Helper function to create mock store
export const createMockReportStore = () => ({
  create: vi.fn(),
  findByUser: vi.fn(),
  findById: vi.fn(),
});

// Query client factory
export const createMockQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

/**
 * Error messages for testing
 */
export const ERROR_MESSAGES = {
  FETCH_REPORTS_FAILED: 'Failed to fetch user reports',
  FETCH_REPORT_FAILED: 'Failed to fetch user report',
  CREATE_ASSOCIATION_FAILED: 'Failed to create report association',
  API_ERROR: 'API error occurred',
} as const;

/**
 * Create a mock QueryClient for testing
 */
export function createMockQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
