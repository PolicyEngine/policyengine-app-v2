import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { ReportCreationPayload } from '@/types/payloads/ReportCreationPayload';
import { ReportSetOutputPayload } from '@/types/payloads/ReportSetOutputPayload';

export const mockReportOutput: ReportOutputSocietyWideUS = {
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
    average: { '1': 100, '2': 200, '3': 300 },
    relative: { '1': 0.01, '2': 0.02, '3': 0.03 },
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
      'Gain less than 5%': [0.1, 0.1, 0.2],
      'Gain more than 5%': [0.5, 0.4, 0.3],
      'Lose less than 5%': [0.05, 0.05, 0.1],
      'Lose more than 5%': [0, 0, 0.05],
      'No change': [0.35, 0.45, 0.35],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: {
        income: { '1': 10, '2': 20, '3': 30 },
        substitution: { '1': 5, '2': 10, '3': 15 },
      },
      relative: {
        income: { '1': 0.01, '2': 0.02, '3': 0.03 },
        substitution: { '1': 0.005, '2': 0.01, '3': 0.015 },
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

export const mockReport: Report = {
  id: '123',
  countryId: 'us',
  year: '2024',
  apiVersion: 'v1',
  simulationIds: ['456', '789'],
  status: 'complete',
  output: mockReportOutput,
};

export const mockPendingReport: Report = {
  id: '1',
  countryId: 'us',
  year: '2025',
  apiVersion: 'v1',
  simulationIds: ['111'],
  status: 'pending',
  output: null,
};

export const mockErrorReport: Report = {
  id: '2',
  countryId: 'us',
  year: '2024',
  apiVersion: 'v1',
  simulationIds: ['222', '333'],
  status: 'error',
  output: null,
};

export const mockReportMetadata: ReportMetadata = {
  id: 123,
  country_id: 'us',
  year: '2024',
  api_version: 'v1',
  simulation_1_id: '456',
  simulation_2_id: '789',
  status: 'complete',
  output: JSON.stringify(mockReportOutput),
};

export const mockReportMetadataSingleSimulation: ReportMetadata = {
  id: 1,
  country_id: 'us',
  year: '2024',
  api_version: 'v1',
  simulation_1_id: '999',
  simulation_2_id: null,
  status: 'pending',
  output: null,
};

export const mockReportCreationPayload: ReportCreationPayload = {
  simulation_1_id: 456,
  simulation_2_id: 789,
  year: '2024',
};

export const mockCompletedReportPayload: ReportSetOutputPayload = {
  id: 123,
  status: 'complete',
  output: JSON.stringify(mockReportOutput),
};

export const mockErrorReportPayload: ReportSetOutputPayload = {
  id: 2,
  status: 'error',
  output: null,
};
