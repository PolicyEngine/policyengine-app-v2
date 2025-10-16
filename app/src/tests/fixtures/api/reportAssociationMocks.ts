import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { UserReport } from '@/types/ingredients/UserReport';

// Test constants
export const TEST_USER_ID = 'user-456';
export const TEST_REPORT_ID = 'report-123';
export const TEST_REPORT_ID_2 = 'report-456';
export const TEST_LABEL = 'My Test Report';
export const TEST_TIMESTAMP = `${CURRENT_YEAR}-01-15T10:00:00Z`;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const mockUserReport: UserReport = {
  id: TEST_REPORT_ID,
  userId: TEST_USER_ID,
  reportId: TEST_REPORT_ID,
  countryId: 'us',
  label: TEST_LABEL,
  createdAt: TEST_TIMESTAMP,
  updatedAt: TEST_TIMESTAMP,
  isCreated: true,
};

export const mockUserReportList: UserReport[] = [
  {
    id: 'report-1',
    userId: TEST_USER_ID,
    reportId: 'report-1',
    countryId: 'us',
    label: 'First Report',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-2',
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

// Error messages
export const ERROR_MESSAGES = {
  CREATE_ASSOCIATION_FAILED: 'Failed to create report association',
  FETCH_ASSOCIATIONS_FAILED: 'Failed to fetch user associations',
  FETCH_ASSOCIATION_FAILED: 'Failed to fetch association',
  FETCH_REPORTS_FAILED: 'Failed to fetch reports',
  FETCH_REPORT_FAILED: 'Failed to fetch report',
  NETWORK_FAILURE: 'Network failure',
} as const;
