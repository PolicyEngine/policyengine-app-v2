import type { MetadataRegionEntry, MetadataState } from '@/types/metadata';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import { US_REGION_TYPES } from '@/types/regionTypes';

// Test constants
export const TEST_COUNTRY_US = 'us';
export const TEST_CURRENT_YEAR = 2025;

/**
 * Mock US congressional district region entries for metadata
 */
export const MOCK_CONGRESSIONAL_DISTRICT_REGIONS: MetadataRegionEntry[] = [
  {
    name: 'us',
    label: 'United States',
    type: US_REGION_TYPES.NATIONAL,
  },
  {
    name: 'AL-01',
    label: "Alabama's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'AL',
    state_name: 'Alabama',
  },
  {
    name: 'AL-02',
    label: "Alabama's 2nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'AL',
    state_name: 'Alabama',
  },
  {
    name: 'CA-52',
    label: "California's 52nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'CA',
    state_name: 'California',
  },
  {
    name: 'NY-14',
    label: "New York's 14th congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'NY',
    state_name: 'New York',
  },
  {
    name: 'TX-35',
    label: "Texas's 35th congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    state_abbreviation: 'TX',
    state_name: 'Texas',
  },
];

/**
 * Mock US report output with congressional district impact data
 */
export const MOCK_US_REPORT_OUTPUT: ReportOutputSocietyWideUS = {
  congressional_district_impact: {
    districts: [
      {
        district: 'AL-01',
        average_household_income_change: 312.45,
        relative_household_income_change: 0.0187,
      },
      {
        district: 'AL-02',
        average_household_income_change: -45.3,
        relative_household_income_change: -0.0028,
      },
      {
        district: 'CA-52',
        average_household_income_change: 612.88,
        relative_household_income_change: 0.041,
      },
      {
        district: 'NY-14',
        average_household_income_change: -234.56,
        relative_household_income_change: -0.0156,
      },
      {
        district: 'TX-35',
        average_household_income_change: 0,
        relative_household_income_change: 0,
      },
    ],
  },
  constituency_impact: null,
  budget: {
    baseline_net_income: 15000000000000,
    benefit_spending_impact: 50000000000,
    budgetary_impact: 75000000000,
    households: 130000000,
    state_tax_revenue_impact: 25000000000,
    tax_revenue_impact: 100000000000,
  },
  cliff_impact: null,
  data_version: '1.0.0',
  decile: {
    average: {
      '1': 500,
      '2': 400,
      '3': 300,
      '4': 200,
      '5': 100,
      '6': 0,
      '7': -100,
      '8': -200,
      '9': -300,
      '10': -400,
    },
    relative: {
      '1': 0.05,
      '2': 0.04,
      '3': 0.03,
      '4': 0.02,
      '5': 0.01,
      '6': 0,
      '7': -0.01,
      '8': -0.02,
      '9': -0.03,
      '10': -0.04,
    },
  },
  detailed_budget: {},
  inequality: {
    gini: { baseline: 0.39, reform: 0.38 },
    top_10_pct_share: { baseline: 0.3, reform: 0.29 },
    top_1_pct_share: { baseline: 0.12, reform: 0.11 },
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
      'Gain less than 5%': [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      'Gain more than 5%': [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
      'Lose less than 5%': [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
      'Lose more than 5%': [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15],
      'No change': [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    },
  },
  intra_wealth_decile: null,
  labor_supply_response: {
    decile: {
      average: { income: {}, substitution: {} },
      relative: { income: {}, substitution: {} },
    },
    hours: {
      baseline: 250000000000,
      change: 1000000000,
      income_effect: 400000000,
      reform: 251000000000,
      substitution_effect: 600000000,
    },
    income_lsr: 0.1,
    relative_lsr: { income: 0.05, substitution: 0.05 },
    revenue_change: 5000000000,
    substitution_lsr: 0.05,
    total_change: 1000000000,
  },
  model_version: '1.0.0',
  poverty: {
    deep_poverty: {
      adult: { baseline: 0.04, reform: 0.035 },
      all: { baseline: 0.05, reform: 0.045 },
      child: { baseline: 0.06, reform: 0.055 },
      senior: { baseline: 0.03, reform: 0.025 },
    },
    poverty: {
      adult: { baseline: 0.11, reform: 0.1 },
      all: { baseline: 0.12, reform: 0.11 },
      child: { baseline: 0.16, reform: 0.15 },
      senior: { baseline: 0.09, reform: 0.08 },
    },
  },
  poverty_by_gender: {
    deep_poverty: {
      female: { baseline: 0.055, reform: 0.05 },
      male: { baseline: 0.045, reform: 0.04 },
    },
    poverty: {
      female: { baseline: 0.13, reform: 0.12 },
      male: { baseline: 0.11, reform: 0.1 },
    },
  },
  poverty_by_race: {
    poverty: {
      black: { baseline: 0.2, reform: 0.18 },
      hispanic: { baseline: 0.18, reform: 0.16 },
      other: { baseline: 0.12, reform: 0.11 },
      white: { baseline: 0.09, reform: 0.085 },
    },
  },
  wealth_decile: null,
};

/**
 * Mock US report output with no congressional district data (null)
 */
export const MOCK_US_REPORT_OUTPUT_NO_DISTRICT: ReportOutputSocietyWideUS = {
  ...MOCK_US_REPORT_OUTPUT,
  congressional_district_impact: null,
};

/**
 * Mock metadata state matching the new MetadataState structure
 * Note: Regions are now accessed via static metadata hooks (useRegionsList),
 * not from Redux state. This mock only contains API-driven data.
 */
export const MOCK_METADATA_WITH_REGIONS: MetadataState = {
  currentCountry: 'us',
  loading: false,
  loaded: true,
  error: null,
  progress: 100,
  variables: {},
  parameters: {},
  datasets: [
    {
      name: 'cps_2023',
      label: 'CPS 2023',
      title: 'Current Population Survey 2023',
      default: true,
    },
  ],
  version: '1.0.0',
  parameterTree: null,
};
