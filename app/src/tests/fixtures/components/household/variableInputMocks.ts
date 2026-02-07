/**
 * Test fixtures for VariableInput component
 * Provides mock variable info, household data, and metadata for testing
 */

import { vi } from 'vitest';
import { Household } from '@/types/ingredients/Household';
import { VariableInfo } from '@/utils/VariableResolver';

// Variable types for testing different input rendering
export const MOCK_FLOAT_VARIABLE: VariableInfo = {
  name: 'employment_income',
  label: 'Employment income',
  entity: 'person',
  dataType: 'float',
  defaultValue: 0,
  possibleValues: null,
  description: 'Annual employment income',
};

export const MOCK_INT_VARIABLE: VariableInfo = {
  name: 'age',
  label: 'Age',
  entity: 'person',
  dataType: 'int',
  defaultValue: 30,
  possibleValues: null,
  description: 'Age of the person',
};

export const MOCK_BOOL_VARIABLE: VariableInfo = {
  name: 'is_disabled',
  label: 'Is disabled',
  entity: 'person',
  dataType: 'bool',
  defaultValue: false,
  possibleValues: null,
  description: 'Whether the person has a disability',
};

export const MOCK_ENUM_VARIABLE: VariableInfo = {
  name: 'state_name',
  label: 'State',
  entity: 'household',
  dataType: 'Enum',
  defaultValue: 'CA',
  possibleValues: ['CA', 'NY', 'TX', 'FL'],
  description: 'State of residence',
};

export const MOCK_STRING_VARIABLE: VariableInfo = {
  name: 'employer_name',
  label: 'Employer name',
  entity: 'person',
  dataType: 'str',
  defaultValue: '',
  possibleValues: null,
  description: 'Name of employer',
};

// Metadata for VariableResolver lookups
export const MOCK_INPUT_METADATA = {
  variables: {
    employment_income: {
      name: 'employment_income',
      label: 'Employment income',
      entity: 'person',
      data_type: 'float',
      default_value: 0,
    },
    age: {
      name: 'age',
      label: 'Age',
      entity: 'person',
      data_type: 'int',
      default_value: 30,
    },
    is_disabled: {
      name: 'is_disabled',
      label: 'Is disabled',
      entity: 'person',
      data_type: 'bool',
      default_value: false,
    },
    state_name: {
      name: 'state_name',
      label: 'State',
      entity: 'household',
      data_type: 'Enum',
      default_value: 'CA',
      possible_values: ['CA', 'NY', 'TX', 'FL'],
    },
    employer_name: {
      name: 'employer_name',
      label: 'Employer name',
      entity: 'person',
      data_type: 'str',
      default_value: '',
    },
  },
  entities: {
    person: { plural: 'people', label: 'Person', is_person: true },
    household: { plural: 'households', label: 'Household', is_person: false },
  },
};

// Base household for testing
export const MOCK_INPUT_HOUSEHOLD: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    { age: 30, employment_income: 50000, is_disabled: false },
    { age: 25, employment_income: 30000, is_disabled: true },
  ],
  household: { state_name: 'CA' },
};

// Helper to create mock onChange handler
export const createMockOnChange = () => vi.fn();
