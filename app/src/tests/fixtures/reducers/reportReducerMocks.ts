import { Report, ReportOutput } from '@/types/ingredients/Report';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

// Test constants
export const TEST_REPORT_ID_1 = 'report-test-123';
export const TEST_REPORT_ID_2 = 'report-test-456';
export const TEST_SIMULATION_ID_1 = 'sim-test-001';
export const TEST_SIMULATION_ID_2 = 'sim-test-002';
export const TEST_SIMULATION_ID_3 = 'sim-test-003';
export const TEST_TIMESTAMP_CREATED = '2024-01-15T10:00:00.000Z';
export const TEST_TIMESTAMP_UPDATED = '2024-01-15T10:30:00.000Z';

// Create a minimal valid US report output
export const MOCK_REPORT_OUTPUT: ReportOutputSocietyWideUS = {
  budget: {
    baseline_net_income: 2500000,
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
    average: { '1': 120, '2': 110, '3': 100, '4': 90, '5': 80 },
    relative: { '1': 0.012, '2': 0.011, '3': 0.01, '4': 0.009, '5': 0.008 },
  },
  detailed_budget: {},
  inequality: {
    gini: { baseline: 0.45, reform: 0.44 },
    top_10_pct_share: { baseline: 0.35, reform: 0.34 },
    top_1_pct_share: { baseline: 0.15, reform: 0.14 },
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
      'Gain less than 5%': [0.1],
      'Gain more than 5%': [0.3],
      'Lose less than 5%': [0.1],
      'Lose more than 5%': [0.05],
      'No change': [0.45],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: { income: {}, substitution: {} },
      relative: { income: {}, substitution: {} },
    },
    hours: {
      baseline: 2000,
      change: 50,
      income_effect: -20,
      reform: 2050,
      substitution_effect: 70,
    },
    income_lsr: -10000,
    relative_lsr: { income: -0.01, substitution: 0.03 },
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
      black: { baseline: 0.22, reform: 0.20 },
      hispanic: { baseline: 0.18, reform: 0.16 },
      other: { baseline: 0.15, reform: 0.14 },
      white: { baseline: 0.09, reform: 0.085 },
    },
  },
  wealth_decile: null,
};

export const MOCK_REPORT_OUTPUT_ALTERNATIVE: ReportOutputSocietyWideUS = {
  budget: {
    baseline_net_income: 1000000,
    benefit_spending_impact: -25000,
    budgetary_impact: 50000,
    households: 130000000,
    state_tax_revenue_impact: 15000,
    tax_revenue_impact: 60000,
  },
  cliff_impact: null,
  constituency_impact: null,
  data_version: '2.1.0',
  decile: {
    average: { '1': 150, '2': 130 },
    relative: { '1': 0.015, '2': 0.013 },
  },
  detailed_budget: {},
  inequality: {
    gini: { baseline: 0.46, reform: 0.45 },
    top_10_pct_share: { baseline: 0.36, reform: 0.35 },
    top_1_pct_share: { baseline: 0.16, reform: 0.15 },
  },
  intra_decile: {
    all: {
      'Gain less than 5%': 0.25,
      'Gain more than 5%': 0.25,
      'Lose less than 5%': 0.15,
      'Lose more than 5%': 0.05,
      'No change': 0.30,
    },
    deciles: {
      'Gain less than 5%': [0.15],
      'Gain more than 5%': [0.25],
      'Lose less than 5%': [0.15],
      'Lose more than 5%': [0.05],
      'No change': [0.40],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: { income: {}, substitution: {} },
      relative: { income: {}, substitution: {} },
    },
    hours: {
      baseline: 2000,
      change: 30,
      income_effect: -10,
      reform: 2030,
      substitution_effect: 40,
    },
    income_lsr: -5000,
    relative_lsr: { income: -0.005, substitution: 0.02 },
    revenue_change: 10000,
    substitution_lsr: 20000,
    total_change: 15000,
  },
  model_version: '1.0.0',
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.055, reform: 0.05 },
      all: { baseline: 0.065, reform: 0.06 },
      child: { baseline: 0.085, reform: 0.075 },
      senior: { baseline: 0.045, reform: 0.04 },
    },
    poverty: {
      adult: { baseline: 0.125, reform: 0.115 },
      all: { baseline: 0.135, reform: 0.125 },
      child: { baseline: 0.185, reform: 0.165 },
      senior: { baseline: 0.095, reform: 0.09 },
    },
  },
  poverty_by_gender: {
    deep_poverty: {
      female: { baseline: 0.07, reform: 0.065 },
      male: { baseline: 0.06, reform: 0.055 },
    },
    poverty: {
      female: { baseline: 0.145, reform: 0.135 },
      male: { baseline: 0.125, reform: 0.115 },
    },
  },
  poverty_by_race: {
    poverty: {
      black: { baseline: 0.225, reform: 0.205 },
      hispanic: { baseline: 0.185, reform: 0.165 },
      other: { baseline: 0.155, reform: 0.145 },
      white: { baseline: 0.095, reform: 0.09 },
    },
  },
  wealth_decile: null,
};

// Initial state
export const EXPECTED_INITIAL_STATE: Report = {
  reportId: '',
  countryId: 'us',
  apiVersion: null,
  simulationIds: [],
  status: 'pending',
  output: null,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

// Mock states for different scenarios
export const MOCK_EMPTY_REPORT: Report = {
  reportId: '',
  countryId: 'us',
  apiVersion: null,
  simulationIds: [],
  status: 'pending',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
};

export const MOCK_PENDING_REPORT: Report = {
  reportId: TEST_REPORT_ID_1,
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_ID_1],
  status: 'pending',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
};

export const MOCK_COMPLETE_REPORT: Report = {
  reportId: TEST_REPORT_ID_1,
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2],
  status: 'complete',
  output: MOCK_REPORT_OUTPUT,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_UPDATED,
};

export const MOCK_ERROR_REPORT: Report = {
  reportId: TEST_REPORT_ID_2,
  countryId: 'uk',
  apiVersion: 'v2',
  simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2, TEST_SIMULATION_ID_3],
  status: 'error',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_UPDATED,
};

// Helper functions for creating test states
export const createMockReportState = (overrides?: Partial<Report>): Report => ({
  reportId: TEST_REPORT_ID_1,
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: [TEST_SIMULATION_ID_1],
  status: 'pending',
  output: null,
  createdAt: TEST_TIMESTAMP_CREATED,
  updatedAt: TEST_TIMESTAMP_CREATED,
  ...overrides,
});

// Assertion helpers
export const expectReportId = (state: Report, expectedId: string) => {
  expect(state.reportId).toBe(expectedId);
};

export const expectSimulationIds = (state: Report, expectedIds: string[]) => {
  expect(state.simulationIds).toEqual(expectedIds);
};

export const expectStatus = (state: Report, expectedStatus: 'pending' | 'complete' | 'error') => {
  expect(state.status).toBe(expectedStatus);
};

export const expectOutput = (state: Report, expectedOutput: ReportOutput | null) => {
  expect(state.output).toEqual(expectedOutput);
};

export const expectTimestampsUpdated = (state: Report, previousState: Report) => {
  expect(state.createdAt).toBe(previousState.createdAt);
  expect(state.updatedAt).not.toBe(previousState.updatedAt);
};

export const expectStateToEqual = (state: Report, expectedState: Report) => {
  expect(state).toEqual(expectedState);
};
