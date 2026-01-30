import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadataContext } from '@/utils/householdValues';

/**
 * Test fixtures for householdValues utility functions (v2 format)
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
      is_person: true,
    },
  },
};

export const MOCK_HOUSEHOLD_DATA: Household = {
  id: 'test-household',
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [
    {
      person_id: 0,
      age: 35,
      benefits: 5000,
      person_tax_unit_id: 0,
      person_family_id: 0,
      person_spm_unit_id: 0,
      person_marital_unit_id: 0,
    },
    {
      person_id: 1,
      age: 32,
      benefits: 3000,
      person_tax_unit_id: 0,
      person_family_id: 0,
      person_spm_unit_id: 0,
      person_marital_unit_id: 0,
    },
  ],
  household: [
    {
      household_id: 0,
      household_income: 50000,
      tax_rate: 0.15,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
  family: [{ family_id: 0 }],
  spm_unit: [{ spm_unit_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }],
};

export const MOCK_HOUSEHOLD_DATA_REFORM: Household = {
  id: 'test-household-reform',
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [
    {
      person_id: 0,
      age: 35,
      benefits: 7000,
      person_tax_unit_id: 0,
      person_family_id: 0,
      person_spm_unit_id: 0,
      person_marital_unit_id: 0,
    },
    {
      person_id: 1,
      age: 32,
      benefits: 5000,
      person_tax_unit_id: 0,
      person_family_id: 0,
      person_spm_unit_id: 0,
      person_marital_unit_id: 0,
    },
  ],
  household: [
    {
      household_id: 0,
      household_income: 52000,
      tax_rate: 0.12,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
  family: [{ family_id: 0 }],
  spm_unit: [{ spm_unit_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }],
};

// In v2, there's no multi-period concept - year is top-level on household.
// We keep this for backward compat but it's just a single-year household.
export const MOCK_HOUSEHOLD_DATA_MULTI_PERIOD: Household = {
  id: 'test-household-multi',
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [],
  household: [
    {
      household_id: 0,
      household_income: 50000,
    },
  ],
};

export const MOCK_PARAMETER = {
  description: 'Standard deduction',
  values: {
    '2020-01-01': 12000,
    '2023-01-01': 13850,
    '2025-01-01': 14600,
    '2026-01-01': 15000,
  },
};

// In v2, entity IDs are numbers instead of named strings
export const TEST_ENTITY_IDS = {
  HOUSEHOLD_0: 0,
  PERSON_0: 0,
  PERSON_1: 1,
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
  AGE_PERSON_0: 35,
  AGE_PERSON_1: 32,
  AGE_TOTAL: 67,
  BENEFITS_PERSON_0: 5000,
  BENEFITS_PERSON_1: 3000,
  BENEFITS_TOTAL: 8000,
  BENEFITS_REFORM_TOTAL: 12000,
  TAX_RATE_2025: 0.15,
  // In v2, no multi-period aggregation - single year value
  HOUSEHOLD_INCOME_SINGLE: 50000,
} as const;

// Note: V2 API doesn't include 'unit' for variables, so currency formatting
// is no longer automatic. Values are formatted as plain numbers.
export const EXPECTED_FORMATTED_VALUES = {
  USD_50000: '50,000', // No currency symbol without unit
  USD_5000: '5,000', // No currency symbol without unit
  PERCENTAGE_15: '0', // No percentage formatting without unit (0.15 -> 0)
  PLAIN_67: '67',
} as const;
