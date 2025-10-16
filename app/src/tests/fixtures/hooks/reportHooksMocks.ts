import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload } from '@/types/payloads';

// Test constants
export const TEST_REPORT_ID = 123;
export const TEST_REPORT_ID_STRING = '123';
export const TEST_USER_ID = MOCK_USER_ID;
export const TEST_COUNTRY_ID = 'us';
export const TEST_LABEL = 'My Test Report';
export const TEST_TIMESTAMP = `${CURRENT_YEAR}-01-15T10:00:00Z`;

// Mock Report Metadata (API response)
export const mockReportMetadata: ReportMetadata = {
  id: TEST_REPORT_ID,
  country_id: TEST_COUNTRY_ID,
  simulation_1_id: '1',
  simulation_2_id: '2',
  api_version: 'v1',
  status: 'pending',
  output: null,
};

// Mock Report Creation Payload
export const mockReportCreationPayload: ReportCreationPayload = {
  simulation_1_id: 1,
  simulation_2_id: 2,
};

// Mock User Report Association
export const mockUserReportAssociation: UserReport = {
  userId: TEST_USER_ID,
  reportId: TEST_REPORT_ID_STRING,
  label: TEST_LABEL,
  isCreated: true,
  id: `sur-${TEST_REPORT_ID_STRING}`,
  createdAt: TEST_TIMESTAMP,
  updatedAt: TEST_TIMESTAMP,
  countryId: 'us',
};

// Constant for UserReport ID
export const TEST_USER_REPORT_ID = `sur-${TEST_REPORT_ID_STRING}`;

// Mock Create Association function
export const createMockCreateAssociation = () => ({
  mutateAsync: vi.fn().mockResolvedValue(mockUserReportAssociation),
});

// Query Client factory
export const createMockQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Add spies for methods we'll assert against
  vi.spyOn(queryClient, 'prefetchQuery');
  vi.spyOn(queryClient, 'invalidateQueries');
  vi.spyOn(queryClient, 'setQueryData');
  vi.spyOn(queryClient, 'getQueryData');

  return queryClient;
};

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

// Mock simulations for testing
export const mockHouseholdSimulation: Simulation = {
  id: 'sim-1',
  policyId: 'policy-1',
  populationType: 'household',
  label: 'Test Household Sim',
  isCreated: true,
};

export const mockSocietyWideSimulation: Simulation = {
  id: 'sim-2',
  policyId: 'policy-2',
  populationType: 'geography',
  label: 'Test Society-Wide Sim',
  isCreated: true,
};

// Mock populations for testing
export const mockHousehold: Household = {
  id: 'household-123',
  countryId: 'us',
  householdData: {
    people: {},
  },
};

export const mockNationalGeography: Geography = {
  id: 'us',
  countryId: 'us',
  scope: 'national',
  geographyId: 'us',
  name: 'United States',
};

export const mockSubnationalGeography: Geography = {
  id: 'us-california',
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'california',
  name: 'California',
};
