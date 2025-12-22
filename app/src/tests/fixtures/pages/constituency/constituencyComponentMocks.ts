import type { MetadataState } from '@/types/metadata';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { DEFAULT_V2_LOADING_STATES } from '../../reducers/metadataReducerMocks';

/**
 * Mock UK report output with constituency data
 */
export const MOCK_UK_REPORT_OUTPUT: ReportOutputSocietyWideUK = {
  constituency_impact: {
    by_constituency: {
      'Westminster North': {
        x: 0,
        y: 0,
        average_household_income_change: 1234.56,
        relative_household_income_change: 0.025,
      },
      'Edinburgh Central': {
        x: 1,
        y: 0,
        average_household_income_change: -567.89,
        relative_household_income_change: -0.015,
      },
      'Cardiff South': {
        x: 0,
        y: 1,
        average_household_income_change: 0,
        relative_household_income_change: 0,
      },
    },
    outcomes_by_region: {
      uk: {
        'Gain more than 5%': 50,
        'Gain less than 5%': 150,
        'No change': 100,
        'Lose less than 5%': 200,
        'Lose more than 5%': 150,
      },
      england: {
        'Gain more than 5%': 40,
        'Gain less than 5%': 120,
        'No change': 80,
        'Lose less than 5%': 160,
        'Lose more than 5%': 120,
      },
      scotland: {
        'Gain more than 5%': 5,
        'Gain less than 5%': 15,
        'No change': 10,
        'Lose less than 5%': 20,
        'Lose more than 5%': 15,
      },
      wales: {
        'Gain more than 5%': 3,
        'Gain less than 5%': 10,
        'No change': 7,
        'Lose less than 5%': 15,
        'Lose more than 5%': 10,
      },
      northern_ireland: {
        'Gain more than 5%': 2,
        'Gain less than 5%': 5,
        'No change': 3,
        'Lose less than 5%': 5,
        'Lose more than 5%': 5,
      },
    },
  },
  budget: {
    baseline_net_income: 1000000,
    benefit_spending_impact: 50000,
    budgetary_impact: 75000,
    households: 30000000,
    state_tax_revenue_impact: 25000,
    tax_revenue_impact: 100000,
  },
  cliff_impact: null,
  data_version: '1.0.0',
  decile: {
    average: {},
    relative: {},
  },
  detailed_budget: {
    child_benefit: { baseline: 0, difference: 0, reform: 0 },
    council_tax: { baseline: 0, difference: 0, reform: 0 },
    fuel_duty: { baseline: 0, difference: 0, reform: 0 },
    income_tax: { baseline: 0, difference: 0, reform: 0 },
    national_insurance: { baseline: 0, difference: 0, reform: 0 },
    ni_employer: { baseline: 0, difference: 0, reform: 0 },
    pension_credit: { baseline: 0, difference: 0, reform: 0 },
    state_pension: { baseline: 0, difference: 0, reform: 0 },
    tax_credits: { baseline: 0, difference: 0, reform: 0 },
    universal_credit: { baseline: 0, difference: 0, reform: 0 },
    vat: { baseline: 0, difference: 0, reform: 0 },
  },
  inequality: {
    gini: { baseline: 0.3, reform: 0.29 },
    top_10_pct_share: { baseline: 0.25, reform: 0.24 },
    top_1_pct_share: { baseline: 0.1, reform: 0.09 },
  },
  intra_decile: {
    all: {
      'Gain less than 5%': 0.3,
      'Gain more than 5%': 0.2,
      'Lose less than 5%': 0.25,
      'Lose more than 5%': 0.15,
      'No change': 0.1,
    },
    deciles: {
      'Gain less than 5%': [],
      'Gain more than 5%': [],
      'Lose less than 5%': [],
      'Lose more than 5%': [],
      'No change': [],
    },
  },
  intra_wealth_decile: {
    all: {
      'Gain less than 5%': 0.3,
      'Gain more than 5%': 0.2,
      'Lose less than 5%': 0.25,
      'Lose more than 5%': 0.15,
      'No change': 0.1,
    },
    deciles: {
      'Gain less than 5%': [],
      'Gain more than 5%': [],
      'Lose less than 5%': [],
      'Lose more than 5%': [],
      'No change': [],
    },
  },
  labor_supply_response: {
    decile: {
      average: { income: {}, substitution: {} },
      relative: { income: {}, substitution: {} },
    },
    hours: {
      baseline: 1000000,
      change: 5000,
      income_effect: 2000,
      reform: 1005000,
      substitution_effect: 3000,
    },
    income_lsr: 0.1,
    relative_lsr: { income: 0.05, substitution: 0.05 },
    revenue_change: 50000,
    substitution_lsr: 0.05,
    total_change: 5000,
  },
  model_version: '1.0.0',
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.05, reform: 0.04 },
      all: { baseline: 0.06, reform: 0.05 },
      child: { baseline: 0.08, reform: 0.07 },
      senior: { baseline: 0.04, reform: 0.03 },
    },
    poverty: {
      adult: { baseline: 0.15, reform: 0.14 },
      all: { baseline: 0.16, reform: 0.15 },
      child: { baseline: 0.2, reform: 0.18 },
      senior: { baseline: 0.12, reform: 0.11 },
    },
  },
  poverty_by_gender: {
    deep_poverty: {
      female: { baseline: 0.06, reform: 0.05 },
      male: { baseline: 0.05, reform: 0.04 },
    },
    poverty: {
      female: { baseline: 0.17, reform: 0.16 },
      male: { baseline: 0.15, reform: 0.14 },
    },
  },
  poverty_by_race: null,
  wealth_decile: {
    average: {},
    relative: {},
  },
};

/**
 * Mock UK report output with no constituency data
 */
export const MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY: ReportOutputSocietyWideUK = {
  ...MOCK_UK_REPORT_OUTPUT,
  constituency_impact: {
    by_constituency: {},
    outcomes_by_region: MOCK_UK_REPORT_OUTPUT.constituency_impact.outcomes_by_region,
  },
};

/**
 * Mock metadata state (only API-driven data)
 */
export const MOCK_METADATA: MetadataState = {
  currentCountry: 'uk',
  ...DEFAULT_V2_LOADING_STATES,
  coreLoaded: true,
  progress: 100,
  variables: {},
  parameters: {},
  datasets: [],
  version: '1.0.0',
  parameterTree: null,
};
