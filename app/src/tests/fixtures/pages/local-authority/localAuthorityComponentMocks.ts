import { HARTLEPOOL_CODE } from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';

/**
 * Mock UK report output with local authority data
 */
export const MOCK_UK_REPORT_OUTPUT_WITH_LA: ReportOutputSocietyWideUK = {
  constituency_impact: {
    by_constituency: {
      'Westminster North': {
        x: 0,
        y: 0,
        average_household_income_change: 1234.56,
        relative_household_income_change: 0.025,
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
  local_authority_impact: {
    by_local_authority: {
      Maidstone: {
        x: 0,
        y: 0,
        average_household_income_change: 1234.56,
        relative_household_income_change: 0.025,
      },
      Westminster: {
        x: 1,
        y: 0,
        average_household_income_change: -567.89,
        relative_household_income_change: -0.015,
      },
      Edinburgh: {
        x: 0,
        y: 1,
        average_household_income_change: 0,
        relative_household_income_change: 0,
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
 * Mock UK report output with no local authority data (empty by_local_authority)
 */
export const MOCK_UK_REPORT_OUTPUT_NO_LA_DATA: ReportOutputSocietyWideUK = {
  ...MOCK_UK_REPORT_OUTPUT_WITH_LA,
  local_authority_impact: {
    by_local_authority: {},
  },
};

/**
 * Mock UK report output without local_authority_impact field at all
 * (for testing the type guard)
 */
export const MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD = (() => {
  const { local_authority_impact: _, ...rest } = MOCK_UK_REPORT_OUTPUT_WITH_LA;
  return rest;
})() as Omit<ReportOutputSocietyWideUK, 'local_authority_impact'>;

/** Real LAD23 codes: three unitary authorities created in April 2023, and Darlington. */
export const CUMBERLAND_CODE = 'E06000063';
export const WESTMORLAND_AND_FURNESS_CODE = 'E06000064';
export const NORTH_YORKSHIRE_CODE = 'E06000065';
export const DARLINGTON_CODE = 'E06000005';

/**
 * Five local authorities at the positions the Public API gives them
 * (`local_authorities_2021.csv`). It puts the three created in 2023,
 * Cumberland, Westmorland and Furness, and North Yorkshire, all at (0, 0).
 */
export const MOCK_UK_REPORT_OUTPUT_WITH_STACKED_LA: ReportOutputSocietyWideUK = {
  ...MOCK_UK_REPORT_OUTPUT_WITH_LA,
  local_authority_impact: {
    by_local_authority: {
      Hartlepool: {
        x: 8,
        y: 19,
        average_household_income_change: -210.4,
        relative_household_income_change: -0.0081,
        code: HARTLEPOOL_CODE,
      },
      Cumberland: {
        x: 0,
        y: 0,
        average_household_income_change: -150.2,
        relative_household_income_change: -0.0052,
        code: CUMBERLAND_CODE,
      },
      'Westmorland and Furness': {
        x: 0,
        y: 0,
        average_household_income_change: -98.6,
        relative_household_income_change: -0.0031,
        code: WESTMORLAND_AND_FURNESS_CODE,
      },
      'North Yorkshire': {
        x: 0,
        y: 0,
        average_household_income_change: -120.9,
        relative_household_income_change: -0.0039,
        code: NORTH_YORKSHIRE_CODE,
      },
      Darlington: {
        x: 7,
        y: 18,
        average_household_income_change: -185.3,
        relative_household_income_change: -0.0072,
        code: DARLINGTON_CODE,
      },
    },
  },
};

/**
 * Codes of districts abolished in April 2023: Allerdale, Craven and Mendip.
 * The layout follows the April 2023 boundaries, so it has none of them.
 */
export const PRE_2023_LOCAL_AUTHORITY_CODES = {
  ALLERDALE: 'E07000026',
  CRAVEN: 'E07000163',
  MENDIP: 'E07000187',
} as const;

/**
 * A saved result from before April 2023: Hartlepool and Darlington on
 * current codes at the Public API's positions, and three districts on
 * pre-2023 codes at made-up positions on the same grid.
 */
export const MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA: ReportOutputSocietyWideUK = {
  ...MOCK_UK_REPORT_OUTPUT_WITH_LA,
  local_authority_impact: {
    by_local_authority: {
      Hartlepool: {
        x: 8,
        y: 19,
        average_household_income_change: -210.4,
        relative_household_income_change: -0.0081,
        code: HARTLEPOOL_CODE,
      },
      Darlington: {
        x: 7,
        y: 18,
        average_household_income_change: -185.3,
        relative_household_income_change: -0.0072,
        code: DARLINGTON_CODE,
      },
      Allerdale: {
        x: 3,
        y: 19,
        average_household_income_change: -140.6,
        relative_household_income_change: -0.0049,
        code: PRE_2023_LOCAL_AUTHORITY_CODES.ALLERDALE,
      },
      Craven: {
        x: 6,
        y: 17,
        average_household_income_change: -101.2,
        relative_household_income_change: -0.0033,
        code: PRE_2023_LOCAL_AUTHORITY_CODES.CRAVEN,
      },
      Mendip: {
        x: 0,
        y: 1,
        average_household_income_change: -88.7,
        relative_household_income_change: -0.0029,
        code: PRE_2023_LOCAL_AUTHORITY_CODES.MENDIP,
      },
    },
  },
};

/** The same result with its codes taken away, so the hex map draws it at its results' positions. */
export const MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA_UNCODED: ReportOutputSocietyWideUK = {
  ...MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA,
  local_authority_impact: {
    by_local_authority: Object.fromEntries(
      Object.entries(
        MOCK_UK_REPORT_OUTPUT_WITH_PRE_2023_LA.local_authority_impact!.by_local_authority
      ).map(([name, { code: _code, ...area }]) => [name, area])
    ),
  },
};
