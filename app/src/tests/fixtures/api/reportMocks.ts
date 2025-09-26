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

// Mock calculation results
export const MOCK_HOUSEHOLD_RESULT = {
  id: 'household-123',
  countryId: 'us',
  householdData: {
    people: {
      person1: { age: 30, income: 50000 },
    },
  },
};

export const MOCK_ECONOMY_RESULT = {
  budget: {
    baseline_net_income: 1000000,
    benefit_spending_impact: -50000,
    budgetary_impact: 25000,
    households: 100000,
    state_tax_revenue_impact: 10000,
    tax_revenue_impact: 75000,
  },
  inequality: {
    gini: {
      baseline: 0.35,
      reform: 0.34,
    },
    top_10_pct_share: {
      baseline: 0.45,
      reform: 0.44,
    },
    top_1_pct_share: {
      baseline: 0.15,
      reform: 0.14,
    },
  },
  poverty: {
    adult: {
      baseline: 0.12,
      reform: 0.11,
    },
    child: {
      baseline: 0.18,
      reform: 0.16,
    },
    senior: {
      baseline: 0.08,
      reform: 0.07,
    },
    all: {
      baseline: 0.13,
      reform: 0.12,
    },
  },
};

// Mock Report objects
export const createMockReport = (overrides?: Partial<Report>): Report => ({
  reportId: EXISTING_REPORT_ID,
  countryId: TEST_COUNTRIES.US,
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
  reportId: ERROR_REPORT_ID,
  status: 'error',
  output: null,
});

export const MOCK_PENDING_REPORT = createMockReport({
  reportId: NEW_REPORT_ID,
  status: 'pending',
});

// Mock ReportMetadata (API response format)
export const createMockReportMetadata = (overrides?: Partial<ReportMetadata>): ReportMetadata => ({
  id: 123,
  country_id: TEST_COUNTRIES.US,
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