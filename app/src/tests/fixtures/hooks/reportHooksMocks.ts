import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { UserReport } from '@/types/ingredients/UserReport';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload } from '@/types/payloads';

// Test constants
export const TEST_REPORT_ID = 123;
export const TEST_REPORT_ID_STRING = '123';
export const TEST_USER_ID = MOCK_USER_ID;
export const TEST_COUNTRY_ID = 'us';
export const TEST_LABEL = 'My Test Report';
export const TEST_TIMESTAMP = '2024-01-15T10:00:00Z';

// Mock Report Metadata (API response)
export const mockReportMetadata: ReportMetadata = {
  id: TEST_REPORT_ID,
  country_id: TEST_COUNTRY_ID,
  simulation_1_id: 'sim-1',
  simulation_2_id: 'sim-2',
  api_version: 'v1',
  status: 'pending',
  output: null,
  created_at: TEST_TIMESTAMP,
  updated_at: TEST_TIMESTAMP,
};

// Mock Report Creation Payload
export const mockReportCreationPayload: ReportCreationPayload = {
  simulation_1_id: 'sim-1',
  simulation_2_id: 'sim-2',
};

// Mock User Report Association
export const mockUserReportAssociation: UserReport = {
  userId: TEST_USER_ID,
  reportId: TEST_REPORT_ID_STRING,
  label: TEST_LABEL,
  isCreated: true,
  id: TEST_REPORT_ID_STRING,
  createdAt: TEST_TIMESTAMP,
  updatedAt: TEST_TIMESTAMP,
};

// Mock Create Association function
export const createMockCreateAssociation = () => ({
  mutateAsync: vi.fn().mockResolvedValue(mockUserReportAssociation),
});

// Query Client factory
export const createMockQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Console mocks
export const setupConsoleMocks = () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  return {
    logSpy,
    errorSpy,
    restore: () => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    },
  };
};

// Error messages
export const ERROR_MESSAGES = {
  CREATE_REPORT_FAILED: 'Failed to create report',
  CREATE_ASSOCIATION_FAILED: 'Failed to create association',
  API_ERROR: 'API Error',
  ASSOCIATION_LOG: 'Report created but association failed:',
} as const;

// Console messages
export const CONSOLE_MESSAGES = {
  LABEL_LOG: 'Report label in useCreateReport:',
} as const;
