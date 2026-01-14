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
  congressional_district_impact: {
    districts: [
      // Alabama
      {
        district: 'AL-01',
        average_household_income_change: 312.45,
        relative_household_income_change: 0.0187,
      },
      {
        district: 'AL-02',
        average_household_income_change: -145.3,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'AL-03',
        average_household_income_change: 278.9,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'AL-04',
        average_household_income_change: 189.2,
        relative_household_income_change: 0.0112,
      },
      {
        district: 'AL-05',
        average_household_income_change: -67.8,
        relative_household_income_change: -0.0045,
      },
      {
        district: 'AL-06',
        average_household_income_change: 423.15,
        relative_household_income_change: 0.0234,
      },
      {
        district: 'AL-07',
        average_household_income_change: 567.9,
        relative_household_income_change: 0.0389,
      },
      // Alaska (at-large)
      {
        district: 'AK-01',
        average_household_income_change: -234.5,
        relative_household_income_change: -0.0156,
      },
      // Arizona
      {
        district: 'AZ-01',
        average_household_income_change: 156.78,
        relative_household_income_change: 0.0098,
      },
      {
        district: 'AZ-02',
        average_household_income_change: -89.45,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'AZ-03',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'AZ-04',
        average_household_income_change: -178.9,
        relative_household_income_change: -0.0123,
      },
      {
        district: 'AZ-05',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'AZ-06',
        average_household_income_change: 89.12,
        relative_household_income_change: 0.0067,
      },
      {
        district: 'AZ-07',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0298,
      },
      {
        district: 'AZ-08',
        average_household_income_change: -56.34,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'AZ-09',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      // California (sample)
      {
        district: 'CA-01',
        average_household_income_change: -123.45,
        relative_household_income_change: -0.0078,
      },
      {
        district: 'CA-02',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
      {
        district: 'CA-03',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'CA-04',
        average_household_income_change: -345.67,
        relative_household_income_change: -0.0234,
      },
      {
        district: 'CA-05',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'CA-06',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0089,
      },
      {
        district: 'CA-07',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'CA-08',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0412,
      },
      {
        district: 'CA-09',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0223,
      },
      {
        district: 'CA-10',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0167,
      },
      {
        district: 'CA-11',
        average_household_income_change: 512.34,
        relative_household_income_change: 0.0312,
      },
      {
        district: 'CA-12',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0456,
      },
      {
        district: 'CA-13',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'CA-14',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'CA-15',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'CA-16',
        average_household_income_change: -78.9,
        relative_household_income_change: -0.0045,
      },
      {
        district: 'CA-17',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0334,
      },
      {
        district: 'CA-18',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'CA-19',
        average_household_income_change: -289.01,
        relative_household_income_change: -0.0189,
      },
      {
        district: 'CA-20',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'CA-21',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0423,
      },
      {
        district: 'CA-22',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'CA-23',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'CA-24',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0267,
      },
      {
        district: 'CA-25',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'CA-26',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
      {
        district: 'CA-27',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0089,
      },
      {
        district: 'CA-28',
        average_household_income_change: -178.9,
        relative_household_income_change: -0.0123,
      },
      {
        district: 'CA-29',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0201,
      },
      {
        district: 'CA-30',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0398,
      },
      {
        district: 'CA-31',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0156,
      },
      {
        district: 'CA-32',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'CA-33',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0467,
      },
      {
        district: 'CA-34',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'CA-35',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'CA-36',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0334,
      },
      {
        district: 'CA-37',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'CA-38',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'CA-39',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0401,
      },
      {
        district: 'CA-40',
        average_household_income_change: -78.9,
        relative_household_income_change: -0.0045,
      },
      {
        district: 'CA-41',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'CA-42',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'CA-43',
        average_household_income_change: -289.01,
        relative_household_income_change: -0.0189,
      },
      {
        district: 'CA-44',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0356,
      },
      {
        district: 'CA-45',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'CA-46',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'CA-47',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0223,
      },
      {
        district: 'CA-48',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0412,
      },
      {
        district: 'CA-49',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'CA-50',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'CA-51',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0478,
      },
      {
        district: 'CA-52',
        average_household_income_change: -178.9,
        relative_household_income_change: -0.0112,
      },
      // Colorado
      {
        district: 'CO-01',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'CO-02',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'CO-03',
        average_household_income_change: -123.45,
        relative_household_income_change: -0.0089,
      },
      {
        district: 'CO-04',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'CO-05',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'CO-06',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
      {
        district: 'CO-07',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'CO-08',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0167,
      },
      // Delaware (at-large)
      {
        district: 'DE-01',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0223,
      },
      // Florida (sample)
      {
        district: 'FL-01',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'FL-02',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'FL-03',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'FL-04',
        average_household_income_change: -78.9,
        relative_household_income_change: -0.0045,
      },
      {
        district: 'FL-05',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0356,
      },
      {
        district: 'FL-06',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0089,
      },
      {
        district: 'FL-07',
        average_household_income_change: -289.01,
        relative_household_income_change: -0.0189,
      },
      {
        district: 'FL-08',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'FL-09',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0423,
      },
      {
        district: 'FL-10',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'FL-11',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'FL-12',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'FL-13',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'FL-14',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
      {
        district: 'FL-15',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'FL-16',
        average_household_income_change: -178.9,
        relative_household_income_change: -0.0123,
      },
      {
        district: 'FL-17',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0201,
      },
      {
        district: 'FL-18',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0398,
      },
      {
        district: 'FL-19',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0156,
      },
      {
        district: 'FL-20',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'FL-21',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0467,
      },
      {
        district: 'FL-22',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'FL-23',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'FL-24',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0334,
      },
      {
        district: 'FL-25',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'FL-26',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'FL-27',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0401,
      },
      {
        district: 'FL-28',
        average_household_income_change: -78.9,
        relative_household_income_change: -0.0045,
      },
      // Georgia
      {
        district: 'GA-01',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'GA-02',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0378,
      },
      {
        district: 'GA-03',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'GA-04',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'GA-05',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0489,
      },
      {
        district: 'GA-06',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'GA-07',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'GA-08',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'GA-09',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0167,
      },
      {
        district: 'GA-10',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'GA-11',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'GA-12',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'GA-13',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0356,
      },
      {
        district: 'GA-14',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0223,
      },
      // New York (sample)
      {
        district: 'NY-01',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'NY-02',
        average_household_income_change: -178.9,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'NY-03',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'NY-04',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0334,
      },
      {
        district: 'NY-05',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'NY-06',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0412,
      },
      {
        district: 'NY-07',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'NY-08',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0156,
      },
      {
        district: 'NY-09',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'NY-10',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0467,
      },
      {
        district: 'NY-11',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'NY-12',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
      {
        district: 'NY-13',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'NY-14',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'NY-15',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0423,
      },
      {
        district: 'NY-16',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0201,
      },
      {
        district: 'NY-17',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'NY-18',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0267,
      },
      {
        district: 'NY-19',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'NY-20',
        average_household_income_change: -289.01,
        relative_household_income_change: -0.0189,
      },
      {
        district: 'NY-21',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'NY-22',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0356,
      },
      {
        district: 'NY-23',
        average_household_income_change: -78.9,
        relative_household_income_change: -0.0045,
      },
      {
        district: 'NY-24',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0223,
      },
      {
        district: 'NY-25',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0398,
      },
      {
        district: 'NY-26',
        average_household_income_change: -123.45,
        relative_household_income_change: -0.0089,
      },
      // Texas (sample)
      {
        district: 'TX-01',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'TX-02',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'TX-03',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'TX-04',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'TX-05',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'TX-06',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
      {
        district: 'TX-07',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0412,
      },
      {
        district: 'TX-08',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0156,
      },
      {
        district: 'TX-09',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'TX-10',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      {
        district: 'TX-11',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'TX-12',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0201,
      },
      {
        district: 'TX-13',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0356,
      },
      {
        district: 'TX-14',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      {
        district: 'TX-15',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'TX-16',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0423,
      },
      {
        district: 'TX-17',
        average_household_income_change: -178.9,
        relative_household_income_change: -0.0123,
      },
      {
        district: 'TX-18',
        average_household_income_change: 789.01,
        relative_household_income_change: 0.0489,
      },
      {
        district: 'TX-19',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'TX-20',
        average_household_income_change: -289.01,
        relative_household_income_change: -0.0189,
      },
      {
        district: 'TX-21',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0267,
      },
      {
        district: 'TX-22',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0145,
      },
      {
        district: 'TX-23',
        average_household_income_change: -78.9,
        relative_household_income_change: -0.0045,
      },
      {
        district: 'TX-24',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0334,
      },
      {
        district: 'TX-25',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0089,
      },
      {
        district: 'TX-26',
        average_household_income_change: -123.45,
        relative_household_income_change: -0.0078,
      },
      {
        district: 'TX-27',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0223,
      },
      {
        district: 'TX-28',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0401,
      },
      {
        district: 'TX-29',
        average_household_income_change: -167.89,
        relative_household_income_change: -0.0112,
      },
      {
        district: 'TX-30',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'TX-31',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'TX-32',
        average_household_income_change: -89.12,
        relative_household_income_change: -0.0056,
      },
      {
        district: 'TX-33',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0356,
      },
      {
        district: 'TX-34',
        average_household_income_change: 345.67,
        relative_household_income_change: 0.0212,
      },
      {
        district: 'TX-35',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0167,
      },
      {
        district: 'TX-36',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0278,
      },
      {
        district: 'TX-37',
        average_household_income_change: 678.9,
        relative_household_income_change: 0.0412,
      },
      {
        district: 'TX-38',
        average_household_income_change: -56.78,
        relative_household_income_change: -0.0034,
      },
      // At-large states
      {
        district: 'ND-01',
        average_household_income_change: 234.56,
        relative_household_income_change: 0.0156,
      },
      {
        district: 'SD-01',
        average_household_income_change: -145.67,
        relative_household_income_change: -0.0098,
      },
      {
        district: 'VT-01',
        average_household_income_change: 456.78,
        relative_household_income_change: 0.0289,
      },
      {
        district: 'WY-01',
        average_household_income_change: 123.45,
        relative_household_income_change: 0.0078,
      },
      // DC
      {
        district: 'DC-01',
        average_household_income_change: 567.89,
        relative_household_income_change: 0.0345,
      },
    ],
  },
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
