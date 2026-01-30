import { Household } from '@/types/ingredients/Household';

/**
 * Mock households for testing household table data utilities
 */

export const MOCK_HOUSEHOLD_SIMPLE: Household = {
  id: 'household-1',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    {
      person_id: 0,
      name: 'person-1',
      age: 35,
      employment_income: 50000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: 'person-2',
      age: 32,
      employment_income: 45000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  family: [{ family_id: 0 }],
  tax_unit: [{ tax_unit_id: 0 }],
  household: [
    {
      household_id: 0,
      state_name: 'CA',
    },
  ],
};

export const MOCK_HOUSEHOLD_COMPLEX: Household = {
  id: 'household-2',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    {
      person_id: 0,
      name: 'adult1',
      age: 45,
      employment_income: 75000,
      self_employment_income: 10000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: 'adult2',
      age: 42,
      employment_income: 65000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 2,
      name: 'child1',
      age: 12,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 3,
      name: 'child2',
      age: 8,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  family: [{ family_id: 0 }],
  tax_unit: [{ tax_unit_id: 0 }],
  household: [
    {
      household_id: 0,
      state_name: 'NY',
      rent: 24000,
    },
  ],
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
      person_id: 0,
      name: 'person-1',
      age: 35,
      employment_income: 50000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: 'person-2',
      age: 32,
      employment_income: 45000,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  family: [{ family_id: 0 }],
  tax_unit: [{ tax_unit_id: 0 }],
  household: [
    {
      household_id: 0,
      state_name: 'CA',
    },
  ],
};
