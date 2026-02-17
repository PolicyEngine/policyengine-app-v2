import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserReport } from '@/types/ingredients/UserReport';

// Re-export from adapters/reportMocks
export { mockReport, mockReportCreationPayload } from '@/tests/fixtures/adapters/reportMocks';

// Re-export from api/reportAssociationMocks
export { TEST_USER_ID } from '@/tests/fixtures/api/reportAssociationMocks';

// Test constants
export const TEST_COUNTRY_ID = 'us';
export const TEST_LABEL = 'Test Report';
export const TEST_REPORT_ID_STRING = '123';
export const TEST_USER_REPORT_ID = 'sur-abc123';

// Mock QueryClient factory
export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Mock console setup
export const setupConsoleMocks = () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  return {
    errorSpy,
    warnSpy,
    logSpy,
    restore: () => {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      logSpy.mockRestore();
    },
  };
};

// Mock Household
export const mockHousehold: Household = {
  id: 'household-123',
  countryId: 'us',
  householdData: {
    people: {},
    families: {},
    tax_units: {},
    spm_units: {},
    households: {},
    marital_units: {},
  },
};

// Mock Geography - National
export const mockNationalGeography: Geography = {
  countryId: 'us',
  regionCode: 'us',
};

// Mock Geography - Subnational
export const mockSubnationalGeography: Geography = {
  countryId: 'us',
  regionCode: 'california',
};

// Mock Simulations
export const mockHouseholdSimulation: Simulation = {
  id: 'sim-456',
  countryId: 'us',
  apiVersion: 'v1',
  policyId: 'policy-1',
  populationId: 'household-123',
  populationType: 'household',
  label: 'Household Simulation',
  isCreated: true,
  status: 'pending',
  output: null,
};

export const mockSocietyWideSimulation: Simulation = {
  id: 'sim-789',
  countryId: 'us',
  apiVersion: 'v1',
  policyId: 'policy-2',
  populationId: 'us',
  populationType: 'geography',
  label: 'Society-Wide Simulation',
  isCreated: true,
  status: 'pending',
  output: null,
};

// Mock UserReport Association
export const mockUserReportAssociation: UserReport = {
  id: TEST_USER_REPORT_ID,
  userId: 'user-123',
  reportId: TEST_REPORT_ID_STRING,
  countryId: TEST_COUNTRY_ID,
  label: TEST_LABEL,
  isCreated: true,
  createdAt: '2025-01-01T00:00:00Z',
};

// Error messages
export const ERROR_MESSAGES = {
  CREATE_REPORT_FAILED: 'Failed to create report',
  API_ERROR: 'API error occurred',
} as const;
