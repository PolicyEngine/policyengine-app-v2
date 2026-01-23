import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadataContext } from '@/utils/householdValues';

/**
 * Test fixtures for householdValues utility functions
 */

export const MOCK_HOUSEHOLD_INCOME_VARIABLE = {
  entity: 'household',
  description: 'Total household income',
  label: 'Household income',
  name: 'household_income',
  data_type: 'float',
};

export const MOCK_AGE_VARIABLE = {
  entity: 'person',
  description: 'Age of person',
  label: 'Age',
  name: 'age',
  data_type: 'int',
};

export const MOCK_BENEFIT_VARIABLE = {
  entity: 'person',
  description: 'Benefits received',
  label: 'Benefits',
  name: 'benefits',
  data_type: 'float',
};

export const MOCK_TAX_RATE_VARIABLE = {
  entity: 'household',
  description: 'Effective tax rate',
  label: 'Tax rate',
  name: 'tax_rate',
  data_type: 'float',
};

// HouseholdMetadataContext for household value tests
export const MOCK_METADATA_CONTEXT: HouseholdMetadataContext = {
  variables: {
    household_income: MOCK_HOUSEHOLD_INCOME_VARIABLE,
    age: MOCK_AGE_VARIABLE,
    benefits: MOCK_BENEFIT_VARIABLE,
    tax_rate: MOCK_TAX_RATE_VARIABLE,
  },
  entities: {
    household: {
      plural: 'households',
      label: 'Household',
      description: 'A household unit',
    },
    person: {
      plural: 'people',
      label: 'Person',
      description: 'An individual person',
    },
  },
};

export const MOCK_HOUSEHOLD_DATA: Household = {
  id: 'test-household',
  countryId: 'us',
  householdData: {
    households: {
      'your household': {
        household_income: {
          [CURRENT_YEAR]: 50000,
        },
        tax_rate: {
          [CURRENT_YEAR]: 0.15,
        },
      },
    },
    people: {
      'person 1': {
        age: {
          [CURRENT_YEAR]: 35,
        },
        benefits: {
          [CURRENT_YEAR]: 5000,
        },
      },
      'person 2': {
        age: {
          [CURRENT_YEAR]: 32,
        },
        benefits: {
          [CURRENT_YEAR]: 3000,
        },
      },
    },
  },
};

export const MOCK_HOUSEHOLD_DATA_REFORM: Household = {
  id: 'test-household-reform',
  countryId: 'us',
  householdData: {
    households: {
      'your household': {
        household_income: {
          [CURRENT_YEAR]: 52000,
        },
        tax_rate: {
          [CURRENT_YEAR]: 0.12,
        },
      },
    },
    people: {
      'person 1': {
        age: {
          [CURRENT_YEAR]: 35,
        },
        benefits: {
          [CURRENT_YEAR]: 7000,
        },
      },
      'person 2': {
        age: {
          [CURRENT_YEAR]: 32,
        },
        benefits: {
          [CURRENT_YEAR]: 5000,
        },
      },
    },
  },
};

export const MOCK_HOUSEHOLD_DATA_MULTI_PERIOD: Household = {
  id: 'test-household-multi',
  countryId: 'us',
  householdData: {
    households: {
      'your household': {
        household_income: {
          '2023': 48000,
          [CURRENT_YEAR]: 50000,
          '2026': 52000,
        },
      },
    },
    people: {},
  },
};

export const MOCK_PARAMETER = {
  description: 'Standard deduction',
  values: {
    '2020-01-01': 12000,
    '2023-01-01': 13850,
    [`${CURRENT_YEAR}-01-01`]: 14600,
    '2026-01-01': 15000,
  },
};

export const TEST_TIME_PERIODS = {
  YEAR_2023: '2023',
  YEAR_2024: CURRENT_YEAR,
  YEAR_2025: CURRENT_YEAR,
} as const;

export const TEST_ENTITY_NAMES = {
  YOUR_HOUSEHOLD: 'your household',
  PERSON_1: 'person 1',
  PERSON_2: 'person 2',
} as const;

export const TEST_VARIABLE_NAMES = {
  HOUSEHOLD_INCOME: 'household_income',
  AGE: 'age',
  BENEFITS: 'benefits',
  TAX_RATE: 'tax_rate',
  NONEXISTENT: 'nonexistent_variable',
} as const;

export const EXPECTED_VALUES = {
  HOUSEHOLD_INCOME_2025: 50000,
  AGE_PERSON_1: 35,
  AGE_PERSON_2: 32,
  AGE_TOTAL: 67,
  BENEFITS_PERSON_1: 5000,
  BENEFITS_PERSON_2: 3000,
  BENEFITS_TOTAL: 8000,
  BENEFITS_REFORM_TOTAL: 12000,
  TAX_RATE_2025: 0.15,
  HOUSEHOLD_INCOME_ALL_PERIODS: 150000, // 48000 + 50000 + 52000
} as const;

// Note: V2 API doesn't include 'unit' for variables, so currency formatting
// is no longer automatic. Values are formatted as plain numbers.
export const EXPECTED_FORMATTED_VALUES = {
  USD_50000: '50,000', // No currency symbol without unit
  USD_5000: '5,000', // No currency symbol without unit
  PERCENTAGE_15: '0', // No percentage formatting without unit (0.15 -> 0)
  PLAIN_67: '67',
} as const;
