import { ReportAdapter } from '@/adapters/ReportAdapter';
import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

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
  countryId: TEST_COUNTRIES.US as (typeof TEST_COUNTRIES)[keyof typeof TEST_COUNTRIES],
  householdData: {
    people: {
      person1: { age: 30, income: 50000 },
    },
  },
};

// Complete mock for US society-wide result
export const MOCK_ECONOMY_RESULT: ReportOutputSocietyWideUS = {
  budget: {
    baseline_net_income: 1000000,
    benefit_spending_impact: -50000,
    budgetary_impact: 25000,
    households: 100000,
    state_tax_revenue_impact: 10000,
    tax_revenue_impact: 75000,
  },
  cliff_impact: null,
  constituency_impact: null,
  data_version: `2025.1.0`,
  decile: {
    average: {
      '1': 10000,
      '2': 20000,
      '3': 30000,
      '4': 40000,
      '5': 50000,
      '6': 60000,
      '7': 70000,
      '8': 80000,
      '9': 90000,
      '10': 100000,
    },
    relative: {
      '1': 90,
      '2': 95,
      '3': 98,
      '4': 100,
      '5': 102,
      '6': 104,
      '7': 106,
      '8': 108,
      '9': 110,
      '10': 115,
    },
  },
  detailed_budget: {},
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
  intra_decile: {
    all: {
      'Gain less than 5%': 20,
      'Gain more than 5%': 20,
      'Lose less than 5%': 20,
      'Lose more than 5%': 20,
      'No change': 20,
    },
    deciles: {
      'Gain less than 5%': [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      'Gain more than 5%': [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      'Lose less than 5%': [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      'Lose more than 5%': [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      'No change': [30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: {
        income: {
          '1': -10,
          '2': -8,
          '3': -6,
          '4': -4,
          '5': -2,
          '6': 0,
          '7': 2,
          '8': 4,
          '9': 6,
          '10': 10,
        },
        substitution: {
          '1': 5,
          '2': 5,
          '3': 5,
          '4': 5,
          '5': 5,
          '6': 5,
          '7': 5,
          '8': 5,
          '9': 5,
          '10': 5,
        },
      },
      relative: {
        income: {
          '1': -0.5,
          '2': -0.4,
          '3': -0.3,
          '4': -0.2,
          '5': -0.1,
          '6': 0,
          '7': 0.1,
          '8': 0.2,
          '9': 0.3,
          '10': 0.5,
        },
        substitution: {
          '1': 0.25,
          '2': 0.25,
          '3': 0.25,
          '4': 0.25,
          '5': 0.25,
          '6': 0.25,
          '7': 0.25,
          '8': 0.25,
          '9': 0.25,
          '10': 0.25,
        },
      },
    },
    hours: {
      baseline: 2000,
      change: 10,
      income_effect: -5,
      reform: 2010,
      substitution_effect: 15,
    },
    income_lsr: -100,
    relative_lsr: {
      income: -0.01,
      substitution: 0.015,
    },
    revenue_change: 50000,
    substitution_lsr: 150,
    total_change: 50,
  },
  model_version: '1.0.0',
  poverty: {
    deep_poverty: {
      adult: {
        baseline: 0.05,
        reform: 0.045,
      },
      all: {
        baseline: 0.06,
        reform: 0.055,
      },
      child: {
        baseline: 0.08,
        reform: 0.07,
      },
      senior: {
        baseline: 0.03,
        reform: 0.025,
      },
    },
    poverty: {
      adult: {
        baseline: 0.12,
        reform: 0.11,
      },
      all: {
        baseline: 0.13,
        reform: 0.12,
      },
      child: {
        baseline: 0.18,
        reform: 0.16,
      },
      senior: {
        baseline: 0.08,
        reform: 0.07,
      },
    },
  },
  poverty_by_gender: {
    deep_poverty: {
      female: {
        baseline: 0.07,
        reform: 0.065,
      },
      male: {
        baseline: 0.05,
        reform: 0.045,
      },
    },
    poverty: {
      female: {
        baseline: 0.14,
        reform: 0.13,
      },
      male: {
        baseline: 0.12,
        reform: 0.11,
      },
    },
  },
  poverty_by_race: {
    poverty: {
      black: {
        baseline: 0.2,
        reform: 0.18,
      },
      hispanic: {
        baseline: 0.18,
        reform: 0.16,
      },
      other: {
        baseline: 0.15,
        reform: 0.14,
      },
      white: {
        baseline: 0.1,
        reform: 0.09,
      },
    },
  },
  wealth_decile: null,
  congressional_district_impact: null,
};

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
