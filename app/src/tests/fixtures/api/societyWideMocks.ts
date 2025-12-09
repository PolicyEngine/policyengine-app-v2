import { vi } from 'vitest';
import { SocietyWideCalculationResponse } from '@/api/societyWideCalculation';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

// Test IDs and constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const TEST_POLICY_IDS = {
  REFORM: '123',
  BASELINE: '456',
  INVALID: '999',
} as const;

export const TEST_REGIONS = {
  ENHANCED_US: 'enhanced_us',
  ENHANCED_UK: 'enhanced_uk',
  STANDARD: 'standard',
} as const;

/**
 * US Congressional district test constants.
 * Format: "district/{STATE_CODE}-{DISTRICT_NUMBER}"
 */
export const TEST_US_DISTRICTS = {
  CA_01: 'district/CA-01',
  CA_12: 'district/CA-12',
  NY_12: 'district/NY-12',
  TX_35: 'district/TX-35',
  AK_01: 'district/AK-01', // At-large district
} as const;

/**
 * US State test constants (lowercase state codes).
 */
export const TEST_US_STATES = {
  CA: 'ca',
  NY: 'ny',
  TX: 'tx',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  CALCULATION_FAILED: (statusText: string) => `Society-wide calculation failed: ${statusText}`,
  TIMEOUT:
    'Society-wide calculation timed out after 25 minutes, the max length for a Google Cloud society-wide simulation Workflow',
  NETWORK_ERROR: 'Network error',
  FAILED_TO_FETCH: 'Failed to fetch',
} as const;

// Mock response helpers
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue(data),
});

export const mockErrorResponse = (status: number) => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
});

// Mock US report output
export const mockUSReportOutput: ReportOutputSocietyWideUS = {
  budget: {
    baseline_net_income: 1000000,
    benefit_spending_impact: -50000,
    budgetary_impact: 75000,
    households: 130000000,
    state_tax_revenue_impact: 25000,
    tax_revenue_impact: 100000,
  },
  cliff_impact: null,
  constituency_impact: null,
  data_version: '2.1.0',
  decile: {
    average: {
      '1': 100,
      '2': 200,
      '3': 300,
      '4': 400,
      '5': 500,
      '6': 600,
      '7': 700,
      '8': 800,
      '9': 900,
      '10': 1000,
    },
    relative: {
      '1': 0.01,
      '2': 0.02,
      '3': 0.03,
      '4': 0.04,
      '5': 0.05,
      '6': 0.06,
      '7': 0.07,
      '8': 0.08,
      '9': 0.09,
      '10': 0.1,
    },
  },
  detailed_budget: {},
  inequality: {
    gini: {
      baseline: 0.45,
      reform: 0.44,
    },
    top_10_pct_share: {
      baseline: 0.35,
      reform: 0.34,
    },
    top_1_pct_share: {
      baseline: 0.15,
      reform: 0.14,
    },
  },
  intra_decile: {
    all: {
      'Gain less than 5%': 0.2,
      'Gain more than 5%': 0.3,
      'Lose less than 5%': 0.1,
      'Lose more than 5%': 0.05,
      'No change': 0.35,
    },
    deciles: {
      'Gain less than 5%': [0.1, 0.1, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
      'Gain more than 5%': [0.5, 0.4, 0.3, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2],
      'Lose less than 5%': [0.05, 0.05, 0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15],
      'Lose more than 5%': [0, 0, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1, 0.1],
      'No change': [0.35, 0.45, 0.35, 0.35, 0.35, 0.35, 0.45, 0.4, 0.35, 0.35],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: {
        income: {
          '1': 10,
          '2': 20,
          '3': 30,
          '4': 40,
          '5': 50,
          '6': 60,
          '7': 70,
          '8': 80,
          '9': 90,
          '10': 100,
        },
        substitution: {
          '1': 5,
          '2': 10,
          '3': 15,
          '4': 20,
          '5': 25,
          '6': 30,
          '7': 35,
          '8': 40,
          '9': 45,
          '10': 50,
        },
      },
      relative: {
        income: {
          '1': 0.01,
          '2': 0.02,
          '3': 0.03,
          '4': 0.04,
          '5': 0.05,
          '6': 0.06,
          '7': 0.07,
          '8': 0.08,
          '9': 0.09,
          '10': 0.1,
        },
        substitution: {
          '1': 0.005,
          '2': 0.01,
          '3': 0.015,
          '4': 0.02,
          '5': 0.025,
          '6': 0.03,
          '7': 0.035,
          '8': 0.04,
          '9': 0.045,
          '10': 0.05,
        },
      },
    },
    hours: {
      baseline: 2000,
      change: 50,
      income_effect: -20,
      reform: 2050,
      substitution_effect: 70,
    },
    income_lsr: -10000,
    relative_lsr: {
      income: -0.01,
      substitution: 0.03,
    },
    revenue_change: 15000,
    substitution_lsr: 30000,
    total_change: 20000,
  },
  model_version: '1.0.0',
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.05, reform: 0.045 },
      all: { baseline: 0.06, reform: 0.055 },
      child: { baseline: 0.08, reform: 0.07 },
      senior: { baseline: 0.04, reform: 0.038 },
    },
    poverty: {
      adult: { baseline: 0.12, reform: 0.11 },
      all: { baseline: 0.13, reform: 0.12 },
      child: { baseline: 0.18, reform: 0.16 },
      senior: { baseline: 0.09, reform: 0.085 },
    },
  },
  poverty_by_gender: {
    deep_poverty: {
      female: { baseline: 0.065, reform: 0.06 },
      male: { baseline: 0.055, reform: 0.05 },
    },
    poverty: {
      female: { baseline: 0.14, reform: 0.13 },
      male: { baseline: 0.12, reform: 0.11 },
    },
  },
  poverty_by_race: {
    poverty: {
      black: { baseline: 0.22, reform: 0.2 },
      hispanic: { baseline: 0.18, reform: 0.16 },
      other: { baseline: 0.15, reform: 0.14 },
      white: { baseline: 0.09, reform: 0.085 },
    },
  },
  wealth_decile: null,
};

// Computing response (API returns 'computing' for society-wide calculations)
export const mockPendingResponse: SocietyWideCalculationResponse = {
  status: 'computing',
  queue_position: 5,
  average_time: 120,
  result: null,
};

// Completed response
export const mockCompletedResponse: SocietyWideCalculationResponse = {
  status: 'ok',
  result: mockUSReportOutput,
};

// Error response
export const mockErrorCalculationResponse: SocietyWideCalculationResponse = {
  status: 'error',
  result: null,
  error: 'Calculation failed due to invalid parameters',
};

// Network error
export const mockNetworkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);

// Fetch error
export const mockFetchError = new Error(ERROR_MESSAGES.FAILED_TO_FETCH);
