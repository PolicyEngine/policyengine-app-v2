import { ReportAdapter } from '@/adapters/ReportAdapter';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import {
  createMockBudgetSummary,
  createMockEconomicImpactResponse,
} from '@/tests/fixtures/v2MockFactory';
import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';

// Test report IDs
export const EXISTING_REPORT_ID = 'report-123';
export const NEW_REPORT_ID = 'report-456';
export const ERROR_REPORT_ID = 'report-error-789';
export const NON_EXISTENT_REPORT_ID = 'report-999';

// Test country IDs
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// Complete mock for US economy-wide result (v2 shape)
export const MOCK_ECONOMY_RESULT: EconomicImpactResponse = createMockEconomicImpactResponse({
  budget_summary: createMockBudgetSummary({
    taxRevenue: 75000,
    stateTaxRevenue: 10000,
    benefitSpending: -50000,
    countPeople: 100000,
    netIncome: 1000000,
  }),
});

// Mock Report objects
export const createMockReport = (overrides?: Partial<Report>): Report => ({
  id: EXISTING_REPORT_ID,
  countryId: TEST_COUNTRIES.US,
  year: '2024',
  apiVersion: '1.0.0',
  simulationIds: ['sim-1', 'sim-2'],
  status: 'pending',
  output: null,
  ...overrides,
});

export const MOCK_COMPLETE_REPORT = createMockReport({
  status: 'complete',
  output: MOCK_ECONOMY_RESULT,
});

export const MOCK_ERROR_REPORT = createMockReport({
  id: ERROR_REPORT_ID,
  status: 'error',
  output: null,
});

export const MOCK_PENDING_REPORT = createMockReport({
  id: NEW_REPORT_ID,
  status: 'pending',
});

// Mock ReportMetadata (API response format)
export const createMockReportMetadata = (overrides?: Partial<ReportMetadata>): ReportMetadata => ({
  id: 123,
  country_id: TEST_COUNTRIES.US,
  year: '2024',
  simulation_1_id: 'sim-1',
  simulation_2_id: 'sim-2',
  api_version: '1.0.0',
  status: 'pending',
  output: null,
  ...overrides,
});

export const MOCK_COMPLETE_REPORT_METADATA = createMockReportMetadata({
  status: 'complete',
  output: JSON.stringify(MOCK_ECONOMY_RESULT),
});

export const MOCK_ERROR_REPORT_METADATA = createMockReportMetadata({
  id: 789,
  status: 'error',
  output: null,
});

// Error messages matching implementation
export const REPORT_ERROR_MESSAGES = {
  UPDATE_FAILED: (reportId: string) => `Failed to update report ${reportId}`,
  FETCH_FAILED: (reportId: string) => `Failed to fetch report ${reportId}`,
  CREATE_FAILED: 'Failed to create report',
} as const;

// Helper to create success response
export const createReportUpdateSuccessResponse = (metadata: ReportMetadata) => ({
  result: metadata,
});

// Helper to create error response
export const createReportUpdateErrorResponse = (status: number, message?: string) => ({
  error: message || 'Report update failed',
  status,
});

// Mock data for createReportAndAssociateWithUser
export const MOCK_USER_REPORT_ID = 'sur-123';
export const MOCK_USER_LABEL = 'Test Report';

export const createMockUserReport = (reportId: string, userId: string, label?: string) => ({
  id: MOCK_USER_REPORT_ID,
  userId,
  reportId,
  label: label || MOCK_USER_LABEL,
  isCreated: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  countryId: 'us' as const,
  type: 'report' as const,
});

export const createMockReportWithAssociationResult = (
  reportMetadata: ReportMetadata,
  userId: string,
  label?: string
) => {
  const report = ReportAdapter.fromMetadata(reportMetadata);
  return {
    report,
    userReport: createMockUserReport(String(reportMetadata.id), userId, label),
    metadata: {
      baseReportId: String(reportMetadata.id),
      userReportId: MOCK_USER_REPORT_ID,
      countryId: reportMetadata.country_id,
    },
  };
};
