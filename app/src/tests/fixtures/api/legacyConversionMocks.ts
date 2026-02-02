import { Household } from '@/types/ingredients/Household';

/**
 * Test fixtures for legacyConversion API functions.
 * Provides v1-format API response data and v2-format household data
 * for testing round-trip conversion at the API boundary.
 */

// --- V1 API response data (keyed by name, year-wrapped values) ---

// US v1 response: single person with employment income
export const MOCK_V1_US_SINGLE_PERSON = {
  people: {
    you: { age: { '2024': 30 }, employment_income: { '2024': 50000 } },
  },
  tax_units: {
    'your tax unit': { members: ['you'] },
  },
  families: {
    'your family': { members: ['you'] },
  },
  spm_units: {
    'your spm unit': { members: ['you'] },
  },
  marital_units: {
    'your marital unit': { members: ['you'] },
  },
  households: {
    'your household': { members: ['you'], state_name: { '2024': 'CA' } },
  },
};

// UK v1 response: single person with benunit
export const MOCK_V1_UK_SINGLE_PERSON = {
  people: {
    you: { age: { '2024': 40 } },
  },
  benunits: {
    'your benefit unit': { members: ['you'], is_married: { '2024': false } },
  },
  households: {
    'your household': { members: ['you'], region: { '2024': 'london' } },
  },
};

// US v1 response: couple with one dependent
export const MOCK_V1_US_FAMILY = {
  people: {
    you: { age: { '2024': 35 } },
    'your partner': { age: { '2024': 33 } },
    'your first dependent': { age: { '2024': 8 } },
  },
  tax_units: {
    'your tax unit': { members: ['you', 'your partner', 'your first dependent'] },
  },
  families: {
    'your family': { members: ['you', 'your partner', 'your first dependent'] },
  },
  spm_units: {
    'your spm unit': { members: ['you', 'your partner', 'your first dependent'] },
  },
  marital_units: {
    'your marital unit': { members: ['you', 'your partner', 'your first dependent'] },
  },
  households: {
    'your household': { members: ['you', 'your partner', 'your first dependent'] },
  },
};

// US v1 response with 2025 year (for year-extraction test)
export const MOCK_V1_US_YEAR_2025 = {
  people: { you: { age: { '2025': 30 } } },
  tax_units: { 'your tax unit': { members: ['you'] } },
  families: { 'your family': { members: ['you'] } },
  spm_units: { 'your spm unit': { members: ['you'] } },
  marital_units: { 'your marital unit': { members: ['you'] } },
  households: { 'your household': { members: ['you'] } },
};

// US v1 response: minimal single person with empty entities
export const MOCK_V1_US_EMPTY_ENTITIES = {
  people: { you: { age: { '2024': 30 } } },
  tax_units: { 'your tax unit': { members: ['you'] } },
  families: { 'your family': { members: ['you'] } },
  spm_units: { 'your spm unit': { members: ['you'] } },
  marital_units: { 'your marital unit': { members: ['you'] } },
  households: { 'your household': { members: ['you'] } },
};

// --- V2 household data (people as array, entity groups as single dicts) ---

// US household: single person with employment income and state
export const MOCK_V2_US_SINGLE_PERSON: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30, employment_income: 50000 }],
  tax_unit: {},
  family: {},
  spm_unit: {},
  marital_unit: {},
  household: { state_name: 'CA' },
};

// US household: couple with child
export const MOCK_V2_US_COUPLE_WITH_CHILD: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    { age: 35 },
    { age: 33 },
    { age: 8, is_tax_unit_dependent: true },
  ],
  tax_unit: {},
  family: {},
  spm_unit: {},
  marital_unit: {},
  household: {},
};

// UK household: single person with benunit and region
export const MOCK_V2_UK_SINGLE_PERSON: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: 2024,
  people: [{ age: 30 }],
  benunit: { is_married: false },
  household: { region: 'london' },
};

// US household: parent with three dependents
export const MOCK_V2_US_MULTIPLE_DEPENDENTS: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    { age: 40 },
    { age: 12, is_tax_unit_dependent: true },
    { age: 10, is_tax_unit_dependent: true },
    { age: 8, is_tax_unit_dependent: true },
  ],
  tax_unit: {},
  family: {},
  spm_unit: {},
  marital_unit: {},
  household: {},
};

// US household: single person with label (for creation payload test)
export const MOCK_V2_US_WITH_LABEL: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30 }],
  label: 'My Household',
};

// US household: round-trip test data (couple with dependent and state)
export const MOCK_V2_US_ROUND_TRIP: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    { age: 35, employment_income: 50000 },
    { age: 10, is_tax_unit_dependent: true },
  ],
  tax_unit: {},
  family: {},
  spm_unit: {},
  marital_unit: {},
  household: { state_name: 'CA' },
};
