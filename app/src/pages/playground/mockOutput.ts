import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

/**
 * Static mock data for the playground page.
 * Represents a hypothetical reform that raises ~$50B, reduces poverty slightly,
 * and has mild distributional effects.
 */
export const mockOutput: ReportOutputSocietyWideUS = {
  budget: {
    baseline_net_income: 12_500_000_000_000,
    benefit_spending_impact: 15_000_000_000,
    budgetary_impact: 50_200_000_000,
    households: 130_000_000,
    state_tax_revenue_impact: 5_000_000_000,
    tax_revenue_impact: 60_200_000_000,
  },
  cliff_impact: null,
  congressional_district_impact: null,
  constituency_impact: null,
  data_version: 'mock-2025',
  decile: {
    average: {
      '1': -120,
      '2': -80,
      '3': -40,
      '4': 50,
      '5': 150,
      '6': 250,
      '7': 400,
      '8': 600,
      '9': 1200,
      '10': 3500,
    },
    relative: {
      '1': -0.008,
      '2': -0.004,
      '3': -0.002,
      '4': 0.002,
      '5': 0.005,
      '6': 0.007,
      '7': 0.009,
      '8': 0.011,
      '9': 0.015,
      '10': 0.022,
    },
  },
  detailed_budget: {},
  inequality: {
    gini: { baseline: 0.405, reform: 0.398 },
    top_10_pct_share: { baseline: 0.295, reform: 0.289 },
    top_1_pct_share: { baseline: 0.089, reform: 0.086 },
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.12,
      'Gain less than 5%': 0.25,
      'No change': 0.35,
      'Lose less than 5%': 0.2,
      'Lose more than 5%': 0.08,
    },
    deciles: {
      'Gain more than 5%': [0.05, 0.08, 0.1, 0.12, 0.14, 0.15, 0.16, 0.14, 0.1, 0.06],
      'Gain less than 5%': [0.15, 0.2, 0.25, 0.28, 0.3, 0.28, 0.25, 0.22, 0.2, 0.18],
      'No change': [0.5, 0.45, 0.4, 0.35, 0.3, 0.3, 0.3, 0.35, 0.4, 0.45],
      'Lose less than 5%': [0.2, 0.18, 0.17, 0.17, 0.18, 0.19, 0.2, 0.2, 0.22, 0.22],
      'Lose more than 5%': [0.1, 0.09, 0.08, 0.08, 0.08, 0.08, 0.09, 0.09, 0.08, 0.09],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: {
        income: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
        substitution: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
      },
      relative: {
        income: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
        substitution: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
      },
    },
    hours: {
      baseline: 250_000_000_000,
      change: -500_000_000,
      income_effect: -300_000_000,
      reform: 249_500_000_000,
      substitution_effect: -200_000_000,
    },
    income_lsr: -0.002,
    relative_lsr: { income: -0.001, substitution: -0.001 },
    revenue_change: -1_000_000_000,
    substitution_lsr: -0.001,
    total_change: -0.002,
  },
  model_version: 'mock-1.0',
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.045, reform: 0.043 },
      all: { baseline: 0.055, reform: 0.052 },
      child: { baseline: 0.07, reform: 0.065 },
      senior: { baseline: 0.03, reform: 0.028 },
    },
    poverty: {
      adult: { baseline: 0.11, reform: 0.105 },
      all: { baseline: 0.125, reform: 0.118 },
      child: { baseline: 0.16, reform: 0.148 },
      senior: { baseline: 0.09, reform: 0.085 },
    },
  },
  poverty_by_gender: {
    deep_poverty: {
      female: { baseline: 0.06, reform: 0.056 },
      male: { baseline: 0.05, reform: 0.048 },
    },
    poverty: {
      female: { baseline: 0.135, reform: 0.127 },
      male: { baseline: 0.115, reform: 0.109 },
    },
  },
  poverty_by_race: {
    poverty: {
      black: { baseline: 0.19, reform: 0.175 },
      hispanic: { baseline: 0.17, reform: 0.158 },
      other: { baseline: 0.12, reform: 0.113 },
      white: { baseline: 0.09, reform: 0.086 },
    },
  },
  wealth_decile: null,
};
