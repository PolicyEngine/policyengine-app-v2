import type { BaselineFile } from '@/libs/flagship/explore/baselineData';

export const CENSUS_URL = 'https://www.census.gov/library/publications/2025/demo/p60-287.html';

/** A small current-law file: the nation, two states and three districts. */
export const BASELINE_FIXTURE: BaselineFile = {
  schema_version: 1,
  country: 'us',
  year: 2026,
  placeholder: true,
  receipt: {
    bundle: 'us-0.0.0',
    model: 'policyengine-us 0.0.0',
    datasets: { national: 'national-test', local: 'local-test' },
    computed_at: null,
  },
  regions: {
    us: {
      label: 'United States',
      metrics: {
        poverty: 0.129,
        child_poverty: 0.134,
        deep_poverty: 0.049,
        median_household_net_income: 80600,
        gini: 0.47,
      },
      benchmarks: {
        poverty: {
          value: 0.129,
          period: '2024',
          source: 'Census Bureau, P60-287',
          url: CENSUS_URL,
        },
      },
    },
    'state/oh': {
      label: 'Ohio',
      metrics: {
        people: 11_800_000,
        poverty: 0.106,
        child_poverty: 0.115,
        deep_poverty: 0.038,
        median_household_net_income: 67800,
        gini: 0.45,
        receipt_snap: 0.15,
        receipt_medicaid: 0.22,
        eitc_per_recipient: 2900,
      },
      poverty_by_group: { children: 0.115, working_age: 0.1, seniors: 0.09 },
      benchmarks: {
        poverty: {
          value: 0.102,
          period: '2022-2024 3-year average',
          source: 'Census Bureau, P60-287',
          url: CENSUS_URL,
        },
      },
    },
    'state/ca': {
      label: 'California',
      metrics: {
        people: 39_000_000,
        poverty: 0.154,
        child_poverty: 0.16,
        deep_poverty: 0.058,
        median_household_net_income: 95500,
        gini: 0.49,
      },
    },
    'congressional_district/OH-01': {
      label: 'OH-01',
      metrics: {
        poverty: 0.09,
        child_poverty: 0.1,
        median_household_net_income: 72000,
        gini: 0.44,
      },
    },
    'congressional_district/OH-09': {
      label: 'OH-09',
      metrics: {
        poverty: 0.12,
        child_poverty: 0.14,
        median_household_net_income: 61000,
        gini: 0.46,
      },
    },
    'congressional_district/CA-01': {
      label: 'CA-01',
      metrics: {
        poverty: 0.15,
        child_poverty: 0.17,
        median_household_net_income: 70000,
        gini: 0.47,
      },
    },
  },
};
