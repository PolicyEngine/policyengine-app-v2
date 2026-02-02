import { Household } from '@/types/ingredients/Household';

/**
 * Mock households for testing household table data utilities
 * v2 Alpha: no person_id/name/person_*_id, entity groups are single dicts
 */

export const MOCK_HOUSEHOLD_SIMPLE: Household = {
  id: 'household-1',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    {
      age: 35,
      employment_income: 50000,
    },
    {
      age: 32,
      employment_income: 45000,
    },
  ],
  family: {},
  tax_unit: {},
  household: {
    state_name: 'CA',
  },
};

export const MOCK_HOUSEHOLD_COMPLEX: Household = {
  id: 'household-2',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    {
      age: 45,
      employment_income: 75000,
      self_employment_income: 10000,
    },
    {
      age: 42,
      employment_income: 65000,
    },
    {
      age: 12,
      is_tax_unit_dependent: true,
    },
    {
      age: 8,
      is_tax_unit_dependent: true,
    },
  ],
  family: {},
  tax_unit: {},
  household: {
    state_name: 'NY',
    rent: 24000,
  },
};

export const MOCK_HOUSEHOLD_EMPTY: Household = {
  id: 'household-empty',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [],
};

// Clone of simple household for equality testing
export const MOCK_HOUSEHOLD_SIMPLE_CLONE: Household = {
  id: 'household-1-clone',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    {
      age: 35,
      employment_income: 50000,
    },
    {
      age: 32,
      employment_income: 45000,
    },
  ],
  family: {},
  tax_unit: {},
  household: {
    state_name: 'CA',
  },
};
