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

export const mockUserReport: UserReport = {
  id: TEST_REPORT_ID,
  userId: TEST_USER_ID,
  reportId: TEST_REPORT_ID,
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
    label: 'First Report',
    createdAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-10T10:00:00Z`,
    isCreated: true,
  },
  {
    id: 'report-2',
    userId: TEST_USER_ID,
    reportId: 'report-2',
    label: 'Second Report',
    createdAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    updatedAt: `${CURRENT_YEAR}-01-12T10:00:00Z`,
    isCreated: true,
  },
];

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
