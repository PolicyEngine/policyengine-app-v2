import { Household } from '@/types/ingredients/Household';

/**
 * Mock households for testing household table data utilities
 */

export const MOCK_HOUSEHOLD_SIMPLE: Household = {
  id: 'household-1',
  countryId: 'us',
  householdData: {
    people: {
      'person-1': {
        age: {
          '2024': 35,
        },
        employment_income: {
          '2024': 50000,
        },
      },
      'person-2': {
        age: {
          '2024': 32,
        },
        employment_income: {
          '2024': 45000,
        },
      },
    },
    families: {
      'family-1': {
        members: ['person-1', 'person-2'],
      },
    },
    taxUnits: {
      'tax-unit-1': {
        members: ['person-1', 'person-2'],
      },
    },
    households: {
      'household-1': {
        members: ['person-1', 'person-2'],
        state_name: {
          '2024': 'CA',
        },
      },
    },
  },
};

export const MOCK_HOUSEHOLD_COMPLEX: Household = {
  id: 'household-2',
  countryId: 'us',
  householdData: {
    people: {
      adult1: {
        age: {
          '2024': 45,
        },
        employment_income: {
          '2024': 75000,
        },
        self_employment_income: {
          '2024': 10000,
        },
      },
      adult2: {
        age: {
          '2024': 42,
        },
        employment_income: {
          '2024': 65000,
        },
      },
      child1: {
        age: {
          '2024': 12,
        },
      },
      child2: {
        age: {
          '2024': 8,
        },
      },
    },
    families: {
      'family-1': {
        members: ['adult1', 'adult2', 'child1', 'child2'],
      },
    },
    taxUnits: {
      'tax-unit-1': {
        members: ['adult1', 'adult2', 'child1', 'child2'],
      },
    },
    households: {
      'household-1': {
        members: ['adult1', 'adult2', 'child1', 'child2'],
        state_name: {
          '2024': 'NY',
        },
        rent: {
          '2024': 24000,
        },
      },
    },
  },
};

export const MOCK_HOUSEHOLD_EMPTY: Household = {
  id: 'household-empty',
  countryId: 'us',
  householdData: {
    people: {},
    families: {},
    taxUnits: {},
    households: {},
  },
};

// Clone of simple household for equality testing
export const MOCK_HOUSEHOLD_SIMPLE_CLONE: Household = {
  id: 'household-1-clone',
  countryId: 'us',
  householdData: {
    people: {
      'person-1': {
        age: {
          '2024': 35,
        },
        employment_income: {
          '2024': 50000,
        },
      },
      'person-2': {
        age: {
          '2024': 32,
        },
        employment_income: {
          '2024': 45000,
        },
      },
    },
    families: {
      'family-1': {
        members: ['person-1', 'person-2'],
      },
    },
    taxUnits: {
      'tax-unit-1': {
        members: ['person-1', 'person-2'],
      },
    },
    households: {
      'household-1': {
        members: ['person-1', 'person-2'],
        state_name: {
          '2024': 'CA',
        },
      },
    },
  },
};
