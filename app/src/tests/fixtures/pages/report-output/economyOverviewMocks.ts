import { EconomyReportOutput } from '@/api/economy';

/**
 * Test fixtures for EconomyOverview component
 */

export const MOCK_ECONOMY_OUTPUT_POSITIVE_IMPACT: EconomyReportOutput = {
  budget: {
    baseline_net_income: 5000000000000,
    benefit_spending_impact: 15000000000,
    budgetary_impact: 20000000000, // $20B revenue
    households: 130000000,
    state_tax_revenue_impact: 5000000000,
    tax_revenue_impact: 15000000000,
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.25,
      'Gain less than 5%': 0.15,
      'Lose more than 5%': 0.05,
      'Lose less than 5%': 0.10,
      'No change': 0.45,
    },
    deciles: {
      'Gain more than 5%': [0.3, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
      'Gain less than 5%': [0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.2],
      'Lose more than 5%': [0, 0, 0, 0.05, 0.05, 0.05, 0.1, 0.1, 0.1, 0.1],
      'Lose less than 5%': [0.05, 0.05, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.15, 0.1],
      'No change': [0.45, 0.45, 0.5, 0.45, 0.55, 0.5, 0.45, 0.45, 0.35, 0.5],
    },
  },
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.05, reform: 0.04 },
      all: { baseline: 0.06, reform: 0.05 },
      child: { baseline: 0.08, reform: 0.06 },
      senior: { baseline: 0.04, reform: 0.03 },
    },
    poverty: {
      adult: { baseline: 0.12, reform: 0.10 },
      all: { baseline: 0.13, reform: 0.11 },
      child: { baseline: 0.18, reform: 0.15 },
      senior: { baseline: 0.09, reform: 0.08 },
    },
  },
} as any;

export const MOCK_ECONOMY_OUTPUT_ZERO_IMPACT: EconomyReportOutput = {
  budget: {
    baseline_net_income: 5000000000000,
    benefit_spending_impact: 0,
    budgetary_impact: 0,
    households: 130000000,
    state_tax_revenue_impact: 0,
    tax_revenue_impact: 0,
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0,
      'Gain less than 5%': 0,
      'Lose more than 5%': 0,
      'Lose less than 5%': 0,
      'No change': 1.0,
    },
    deciles: {
      'Gain more than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Gain less than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Lose more than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Lose less than 5%': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'No change': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
  },
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.05, reform: 0.05 },
      all: { baseline: 0.06, reform: 0.06 },
      child: { baseline: 0.08, reform: 0.08 },
      senior: { baseline: 0.04, reform: 0.04 },
    },
    poverty: {
      adult: { baseline: 0.12, reform: 0.12 },
      all: { baseline: 0.13, reform: 0.13 },
      child: { baseline: 0.18, reform: 0.18 },
      senior: { baseline: 0.09, reform: 0.09 },
    },
  },
} as any;

export const MOCK_ECONOMY_OUTPUT_ZERO_BASELINE_POVERTY: EconomyReportOutput = {
  budget: {
    baseline_net_income: 5000000000000,
    benefit_spending_impact: 15000000000,
    budgetary_impact: 20000000000,
    households: 130000000,
    state_tax_revenue_impact: 5000000000,
    tax_revenue_impact: 15000000000,
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.25,
      'Gain less than 5%': 0.15,
      'Lose more than 5%': 0.05,
      'Lose less than 5%': 0.10,
      'No change': 0.45,
    },
    deciles: {
      'Gain more than 5%': [0.3, 0.3, 0.3, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1],
      'Gain less than 5%': [0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.2],
      'Lose more than 5%': [0, 0, 0, 0.05, 0.05, 0.05, 0.1, 0.1, 0.1, 0.1],
      'Lose less than 5%': [0.05, 0.05, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.15, 0.1],
      'No change': [0.45, 0.45, 0.5, 0.45, 0.55, 0.5, 0.45, 0.45, 0.35, 0.5],
    },
  },
  poverty: {
    deep_poverty: {
      adult: { baseline: 0, reform: 0 },
      all: { baseline: 0, reform: 0 },
      child: { baseline: 0, reform: 0 },
      senior: { baseline: 0, reform: 0 },
    },
    poverty: {
      adult: { baseline: 0, reform: 0 },
      all: { baseline: 0, reform: 0 },
      child: { baseline: 0, reform: 0 },
      senior: { baseline: 0, reform: 0 },
    },
  },
} as any;

export const TEST_LABELS = {
  COST: 'Cost',
  NO_BUDGET_IMPACT: 'Has no impact on the budget',
  POVERTY_IMPACT: 'Poverty',
  ERROR_POVERTY: 'Error calculating poverty impact',
  NET_INCOME: 'Net income',
  NO_CHANGE: 'Does not affect anyone\'s net income',
  RAISES: 'Raises',
  LOWERS: 'Lowers',
} as const;

export const EXPECTED_FORMATTED_VALUES = {
  BUDGET_20B: '20.0',
  BILLION_LABEL: 'billion',
  POVERTY_DECREASE: '-15.4%',
  WINNERS_40: '40',
  LOSERS_15: '15',
} as const;
