/**
 * Fixtures for HouseholdReproducibility and PolicyReproducibility component tests
 */

import { TEST_COUNTRIES } from '@/tests/fixtures/constants';

/**
 * Mock policy in v1 format for testing components
 */
export const MOCK_POLICY_V1 = {
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
 * Mock empty policy (current law)
 */
export const MOCK_EMPTY_POLICY_V1 = {
  baseline: { data: {} },
  reform: { data: {} },
};

/**
 * Mock household input for testing
 */
export const MOCK_HOUSEHOLD_INPUT = {
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
 * Default props for HouseholdReproducibility component
 */
export const DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS = {
  countryId: TEST_COUNTRIES.US,
  policy: MOCK_POLICY_V1,
  householdInput: MOCK_HOUSEHOLD_INPUT,
  region: TEST_COUNTRIES.US,
  dataset: null,
};

/**
 * Default props for PolicyReproducibility component
 */
export const DEFAULT_POLICY_REPRODUCIBILITY_PROPS = {
  countryId: TEST_COUNTRIES.US,
  policy: MOCK_POLICY_V1,
  region: TEST_COUNTRIES.US,
  dataset: null,
};

/**
 * UK variant props for HouseholdReproducibility
 */
export const UK_HOUSEHOLD_REPRODUCIBILITY_PROPS = {
  countryId: TEST_COUNTRIES.UK,
  policy: MOCK_POLICY_V1,
  householdInput: MOCK_HOUSEHOLD_INPUT,
  region: TEST_COUNTRIES.UK,
  dataset: null,
};

/**
 * UK variant props for PolicyReproducibility
 */
export const UK_POLICY_REPRODUCIBILITY_PROPS = {
  countryId: TEST_COUNTRIES.UK,
  policy: MOCK_POLICY_V1,
  region: TEST_COUNTRIES.UK,
  dataset: null,
};

/**
 * Expected text content for assertions
 */
export const EXPECTED_TEXT = {
  TITLE: 'Reproduce these results',
  INSTRUCTION_PREFIX: 'Run the code below in a',
  PYTHON_NOTEBOOK: 'Python notebook',
  EARNING_VARIATION_LABEL: 'Include earning variation',
  COPY_LABEL: 'Copy to clipboard',
  COPIED_LABEL: 'Copied!',
  PYTHON_LABEL: 'Python',
  MICROSIMULATION_INSTRUCTION: 'microsimulation results',
} as const;

/**
 * Expected code snippets that should appear in the generated code
 * Note: Use regex-safe patterns (escape special chars like parentheses)
 */
export const EXPECTED_CODE_SNIPPETS = {
  US_HOUSEHOLD_IMPORT: 'from policyengine_us import Simulation',
  UK_HOUSEHOLD_IMPORT: 'from policyengine_uk import Simulation',
  US_POLICY_IMPORT: 'from policyengine_us import Microsimulation',
  UK_POLICY_IMPORT: 'from policyengine_uk import Microsimulation',
  REFORM_IMPORT: 'from policyengine_core.reforms import Reform',
  // Use regex-escaped versions for patterns with special characters
  SIMULATION_CREATE: 'simulation = Simulation\\(',
  MICROSIMULATION_CREATE: 'Microsimulation\\(',
} as const;

/**
 * Mock report year hook return value
 */
export const MOCK_REPORT_YEAR = '2024';

/**
 * Mock clipboard API
 */
export const createMockClipboard = () => ({
  writeText: async (_text: string) => Promise.resolve(),
});
