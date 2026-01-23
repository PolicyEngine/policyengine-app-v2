/**
 * Fixtures for static data module tests
 */

// Test country codes
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  UNKNOWN: 'zz',
} as const;

// Expected US entity keys
export const EXPECTED_US_ENTITY_KEYS = [
  'person',
  'family',
  'household',
  'marital_unit',
  'tax_unit',
  'spm_unit',
] as const;

// Expected UK entity keys
export const EXPECTED_UK_ENTITY_KEYS = ['person', 'benunit', 'household'] as const;

// Expected US basic inputs
export const EXPECTED_US_BASIC_INPUTS = ['age', 'employment_income', 'state_name'] as const;

// Expected UK basic inputs
export const EXPECTED_UK_BASIC_INPUTS = ['age', 'employment_income', 'region'] as const;

// Default date range fallback values
export const DEFAULT_DATE_RANGE = {
  minDate: '2022-01-01',
  maxDate: '2035-12-31',
} as const;

// Expected tax year range (based on actual time periods in timePeriods.ts)
export const EXPECTED_TAX_YEAR_RANGE = {
  US: { min: 2022, max: 2035 },
  UK: { min: 2024, max: 2030 },
} as const;

// Expected entity properties
export const EXPECTED_ENTITY_PROPERTIES = {
  PERSON: {
    label: 'Person',
    plural: 'people',
    is_person: true,
  },
  TAX_UNIT: {
    label: 'Tax Unit',
    plural: 'tax units',
  },
  BENUNIT: {
    label: 'Benefit Unit',
    plural: 'benefit units',
  },
} as const;
