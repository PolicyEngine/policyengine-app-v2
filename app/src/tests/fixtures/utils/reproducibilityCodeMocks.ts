/**
 * Fixtures for reproducibilityCode utility tests
 */

import { TEST_COUNTRIES } from '../constants';

/**
 * Policy format used by v1 and the reproducibility code
 */
export interface PolicyV1Format {
  baseline: { data: Record<string, any> };
  reform: { data: Record<string, any> };
}

/**
 * Test years for reproducibility code
 */
export const TEST_YEARS = {
  DEFAULT: 2024,
  PREVIOUS: 2023,
  FUTURE: 2025,
} as const;

/**
 * Empty policy (current law baseline, no reform)
 */
export const EMPTY_POLICY: PolicyV1Format = {
  baseline: { data: {} },
  reform: { data: {} },
};

/**
 * Policy with only reform parameters (common case)
 */
export const REFORM_ONLY_POLICY: PolicyV1Format = {
  baseline: { data: {} },
  reform: {
    data: {
      'gov.irs.credits.ctc.amount.base': {
        '2024-01-01.2100-12-31': 3000,
      },
    },
  },
};

/**
 * Policy with both baseline and reform parameters
 */
export const BASELINE_AND_REFORM_POLICY: PolicyV1Format = {
  baseline: {
    data: {
      'gov.irs.income.standard_deduction.amount': {
        '2024-01-01.2100-12-31': 15000,
      },
    },
  },
  reform: {
    data: {
      'gov.irs.credits.ctc.amount.base': {
        '2024-01-01.2100-12-31': 3000,
      },
      'gov.irs.credits.ctc.phase_out.threshold.joint': {
        '2024-01-01.2100-12-31': 500000,
      },
    },
  },
};

/**
 * Policy with Infinity values (tests numpy import)
 */
export const POLICY_WITH_INFINITY: PolicyV1Format = {
  baseline: { data: {} },
  reform: {
    data: {
      'gov.irs.credits.ctc.phase_out.threshold.joint': {
        '2024-01-01.2100-12-31': Infinity,
      },
    },
  },
};

/**
 * Policy with negative Infinity values
 */
export const POLICY_WITH_NEGATIVE_INFINITY: PolicyV1Format = {
  baseline: { data: {} },
  reform: {
    data: {
      'gov.some.parameter': {
        '2024-01-01.2100-12-31': -Infinity,
      },
    },
  },
};

/**
 * Simple household input for testing
 */
export const SIMPLE_HOUSEHOLD_INPUT = {
  people: {
    you: {
      age: { 2024: 35 },
      employment_income: { 2024: 55000 },
    },
  },
  families: {
    'your family': {
      members: ['you'],
    },
  },
  marital_units: {
    'your marital unit': {
      members: ['you'],
    },
  },
  tax_units: {
    'your tax unit': {
      members: ['you'],
    },
  },
  spm_units: {
    'your spm_unit': {
      members: ['you'],
    },
  },
  households: {
    'your household': {
      members: ['you'],
      state_code: { 2024: 'CA' },
    },
  },
};

/**
 * Household input with null values (tests cleanup)
 */
export const HOUSEHOLD_INPUT_WITH_NULLS = {
  people: {
    you: {
      age: { 2024: 35 },
      employment_income: { 2024: 55000 },
      some_null_variable: { 2024: null },
    },
  },
  families: {
    'your family': {
      members: ['you'],
    },
  },
  marital_units: {
    'your marital unit': {
      members: ['you'],
    },
  },
  tax_units: {
    'your tax unit': {
      members: ['you'],
    },
  },
  spm_units: {
    'your spm_unit': {
      members: ['you'],
    },
  },
  households: {
    'your household': {
      members: ['you'],
      state_code: { 2024: 'CA' },
    },
  },
};

/**
 * Complex household input with multiple people
 */
export const COMPLEX_HOUSEHOLD_INPUT = {
  people: {
    you: {
      age: { 2024: 35 },
      employment_income: { 2024: 55000 },
    },
    your_partner: {
      age: { 2024: 33 },
      employment_income: { 2024: 45000 },
    },
    child_1: {
      age: { 2024: 8 },
    },
  },
  families: {
    'your family': {
      members: ['you', 'your_partner', 'child_1'],
    },
  },
  marital_units: {
    'your marital unit': {
      members: ['you', 'your_partner'],
    },
    "child_1's marital unit": {
      members: ['child_1'],
    },
  },
  tax_units: {
    'your tax unit': {
      members: ['you', 'your_partner', 'child_1'],
    },
  },
  spm_units: {
    'your spm_unit': {
      members: ['you', 'your_partner', 'child_1'],
    },
  },
  households: {
    'your household': {
      members: ['you', 'your_partner', 'child_1'],
      state_code: { 2024: 'CA' },
    },
  },
};

/**
 * v2 Policy format (array of policies from DB)
 */
export const V2_POLICIES_EMPTY: any[] = [];

export const V2_POLICIES_BASELINE_ONLY = [
  {
    id: 'policy-1',
    countryId: TEST_COUNTRIES.US,
    parameters: [],
  },
];

export const V2_POLICIES_WITH_REFORM = [
  {
    id: 'policy-1',
    countryId: TEST_COUNTRIES.US,
    parameters: [],
  },
  {
    id: 'policy-2',
    countryId: TEST_COUNTRIES.US,
    parameters: [
      {
        name: 'gov.irs.credits.ctc.amount.base',
        values: [
          {
            startDate: '2024-01-01',
            endDate: '2100-12-31',
            value: 3000,
          },
        ],
      },
    ],
  },
];

export const V2_POLICIES_BOTH_CUSTOM = [
  {
    id: 'policy-1',
    countryId: TEST_COUNTRIES.US,
    parameters: [
      {
        name: 'gov.irs.income.standard_deduction.amount',
        values: [
          {
            startDate: '2024-01-01',
            endDate: '2100-12-31',
            value: 15000,
          },
        ],
      },
    ],
  },
  {
    id: 'policy-2',
    countryId: TEST_COUNTRIES.US,
    parameters: [
      {
        name: 'gov.irs.credits.ctc.amount.base',
        values: [
          {
            startDate: '2024-01-01',
            endDate: '2100-12-31',
            value: 3000,
          },
        ],
      },
    ],
  },
];

/**
 * Dataset constants
 */
export const TEST_DATASETS = {
  ENHANCED_CPS_2024: 'enhanced_cps_2024',
  UNKNOWN_DATASET: 'unknown_dataset',
} as const;

/**
 * Region constants
 */
export const TEST_REGIONS = {
  US_NATIONAL: 'us',
  CA_STATE: 'ca',
  UK_NATIONAL: 'uk',
} as const;

/**
 * Expected Colab links
 */
export const EXPECTED_COLAB_LINKS = {
  US: 'https://colab.research.google.com/drive/1hqA9a2LrNj2leJ9YtXXC3xyaCXQ7mwUW?usp=sharing',
  UK: 'https://colab.research.google.com/drive/16h6v-EAYk5n4qZ4krXbmFG4_oKAaflo9#scrollTo=TBTIupkjIThF',
} as const;

/**
 * Expected Python imports for different scenarios
 */
export const EXPECTED_IMPORTS = {
  US_HOUSEHOLD: 'from policyengine_us import Simulation',
  UK_HOUSEHOLD: 'from policyengine_uk import Simulation',
  US_POLICY: 'from policyengine_us import Microsimulation',
  UK_POLICY: 'from policyengine_uk import Microsimulation',
  REFORM_IMPORT: 'from policyengine_core.reforms import Reform',
  NUMPY_IMPORT: 'import numpy as np',
} as const;
