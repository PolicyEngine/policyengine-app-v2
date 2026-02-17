import { Household, HouseholdPerson } from '@/types/ingredients/Household';

/**
 * Test fixtures for householdIndividuals utility functions.
 * Provides people arrays and household objects for display name
 * and entity extraction tests.
 */

// --- People arrays for getPersonDisplayNameInContext ---

// US household: two adults + two dependents (flagged via is_tax_unit_dependent)
export const MOCK_US_FAMILY_PEOPLE: HouseholdPerson[] = [
  { age: 40 },
  { age: 38 },
  { age: 12, is_tax_unit_dependent: true },
  { age: 8, is_tax_unit_dependent: true },
];

// UK household: one adult + one child (dependent by age only)
export const MOCK_UK_PARENT_CHILD_PEOPLE: HouseholdPerson[] = [{ age: 30 }, { age: 5 }];

// Large household: 1 adult + 11 dependents (tests ordinal fallback to Nth)
export const MOCK_MANY_DEPENDENTS_PEOPLE: HouseholdPerson[] = [
  { age: 40 },
  ...Array.from({ length: 11 }, (_, i) => ({
    age: i + 1,
    is_tax_unit_dependent: true as const,
  })),
];

// --- Households for getAllPersonDisplayNames and extractGroupEntities ---

// US household: two adults + one dependent
export const MOCK_HOUSEHOLD_WITH_NAMES: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 35 }, { age: 33 }, { age: 10, is_tax_unit_dependent: true }],
};

// Empty household
export const MOCK_EMPTY_HOUSEHOLD: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [],
};

// US household with person and entity data (for extractGroupEntities)
export const MOCK_HOUSEHOLD_WITH_ENTITIES: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30 }],
  tax_unit: {},
  household: { state_name: 'CA' },
};

// US household with multiple entity variables
export const MOCK_HOUSEHOLD_WITH_ENTITY_VARS: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30 }],
  household: { state_name: 'CA', rent: 24000 },
};

// US household with multiple empty entities (for skip test)
export const MOCK_HOUSEHOLD_EMPTY_ENTITIES: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30 }],
  tax_unit: {},
  family: {},
  household: {},
};
