import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
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
export const TEST_YEAR = '2025';
export const TEST_LABEL = 'Test Report';
export const TEST_REPORT_ID_STRING = '123';
export const TEST_USER_REPORT_ID = 'sur-abc123';
export const TEST_V2_REPORT_ID = 'v2-report-abc';
export const TEST_V2_BASELINE_SIM_ID = 'v2-sim-baseline';
export const TEST_V2_REFORM_SIM_ID = 'v2-sim-reform';

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
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [],
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

// Mock Simulations (input — what the pathway passes in)
export const mockHouseholdSimulation: Simulation = {
  id: 'sim-456',
  policyId: 'policy-1',
  populationId: 'household-123',
  populationType: 'household',
  label: 'Household Simulation',
  isCreated: true,
};

export const mockSocietyWideSimulation: Simulation = {
  id: 'sim-789',
  policyId: 'policy-2',
  populationId: 'us',
  populationType: 'geography',
  label: 'Society-Wide Simulation',
  isCreated: true,
};

// v2 API responses
export const mockHouseholdImpactResponse: HouseholdImpactResponse = {
  report_id: TEST_V2_REPORT_ID,
  report_type: 'household',
  status: 'pending',
  baseline_simulation: { id: TEST_V2_BASELINE_SIM_ID, status: 'pending', error_message: null },
  reform_simulation: { id: TEST_V2_REFORM_SIM_ID, status: 'pending', error_message: null },
  baseline_result: null,
  reform_result: null,
  impact: null,
  error_message: null,
};

export const mockHouseholdImpactBaselineOnlyResponse: HouseholdImpactResponse = {
  report_id: 'v2-report-baseline-only',
  report_type: 'household',
  status: 'pending',
  baseline_simulation: { id: TEST_V2_BASELINE_SIM_ID, status: 'pending', error_message: null },
  reform_simulation: null,
  baseline_result: null,
  reform_result: null,
  impact: null,
  error_message: null,
};

export const mockEconomyImpactResponse: EconomicImpactResponse = {
  report_id: TEST_V2_REPORT_ID,
  status: 'pending',
  baseline_simulation: { id: TEST_V2_BASELINE_SIM_ID, status: 'pending', error_message: null },
  reform_simulation: { id: TEST_V2_REFORM_SIM_ID, status: 'pending', error_message: null },
  region: null,
  error_message: null,
  decile_impacts: null,
  program_statistics: null,
  poverty: null,
  inequality: null,
  budget_summary: null,
  intra_decile: null,
  detailed_budget: null,
  congressional_district_impact: null,
  constituency_impact: null,
  local_authority_impact: null,
  wealth_decile: null,
  intra_wealth_decile: null,
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
  HOUSEHOLD_ANALYSIS_FAILED: 'Failed to create household analysis: 500 Internal Server Error',
  ECONOMY_ANALYSIS_FAILED: 'Failed to create economy analysis: 500 Internal Server Error',
} as const;
