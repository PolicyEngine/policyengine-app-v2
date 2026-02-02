import { Household } from '@/types/ingredients/Household';

/**
 * Test fixtures for householdVariationAxes utility functions.
 * Provides household data for variation axis building tests.
 */

// Base US household with standard employment income
export const MOCK_BASE_HOUSEHOLD: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30, employment_income: 50000 }],
  household: { state_name: 'CA' },
};

// High-income household (triggers 2x earnings max)
export const MOCK_HIGH_INCOME_HOUSEHOLD: Household = {
  ...MOCK_BASE_HOUSEHOLD,
  people: [{ age: 30, employment_income: 300000 }],
};

// Household with no employment income set
export const MOCK_NO_INCOME_HOUSEHOLD: Household = {
  ...MOCK_BASE_HOUSEHOLD,
  people: [{ age: 30 }],
};

// Two-person household for custom person index tests
export const MOCK_TWO_PERSON_HOUSEHOLD: Household = {
  ...MOCK_BASE_HOUSEHOLD,
  people: [
    { age: 35, employment_income: 80000 },
    { age: 33, employment_income: 60000 },
  ],
};

// Empty people array (for error case)
export const MOCK_EMPTY_PEOPLE_HOUSEHOLD: Household = {
  ...MOCK_BASE_HOUSEHOLD,
  people: [],
};

// Household with self-employment income (for buildVariationAxesForVariable)
export const MOCK_SELF_EMPLOYMENT_HOUSEHOLD: Household = {
  ...MOCK_BASE_HOUSEHOLD,
  people: [{ age: 30, self_employment_income: 20000 }],
};

// Household with multiple income variables (for buildMultiDimensionalAxes)
export const MOCK_MULTI_INCOME_HOUSEHOLD: Household = {
  ...MOCK_BASE_HOUSEHOLD,
  people: [{ age: 30, employment_income: 50000, self_employment_income: 10000 }],
};
