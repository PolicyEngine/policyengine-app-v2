import { Household } from '@/types/ingredients/Household';

/**
 * Test fixtures for VariableResolver utility functions (v2 Alpha format)
 * Provides mock metadata and household data for entity-aware variable access tests.
 */

// Mock variable definitions matching V2 API metadata shape
export const MOCK_AGE_VARIABLE = {
  name: 'age',
  label: 'Age',
  entity: 'person',
  data_type: 'int',
  default_value: 0,
  description: 'Age of the person',
};

export const MOCK_EMPLOYMENT_INCOME_VARIABLE = {
  name: 'employment_income',
  label: 'Employment income',
  entity: 'person',
  data_type: 'float',
  default_value: 0,
  possible_values: null,
};

export const MOCK_STATE_NAME_VARIABLE = {
  name: 'state_name',
  label: 'State',
  entity: 'household',
  data_type: 'Enum',
  default_value: 'CA',
  possible_values: ['CA', 'NY', 'TX'],
};

export const MOCK_TAX_UNIT_HEAD_VARIABLE = {
  name: 'is_tax_unit_head',
  label: 'Is tax unit head',
  entity: 'tax_unit',
  data_type: 'bool',
  default_value: false,
};

// Mock entity definitions matching V2 API metadata shape
export const MOCK_ENTITY_DEFINITIONS = {
  person: { plural: 'people', label: 'Person', is_person: true },
  household: { plural: 'households', label: 'Household', is_person: false },
  tax_unit: { plural: 'tax_units', label: 'Tax Unit', is_person: false },
};

// Full metadata object combining variables and entities
export const MOCK_RESOLVER_METADATA = {
  variables: {
    age: MOCK_AGE_VARIABLE,
    employment_income: MOCK_EMPLOYMENT_INCOME_VARIABLE,
    state_name: MOCK_STATE_NAME_VARIABLE,
    is_tax_unit_head: MOCK_TAX_UNIT_HEAD_VARIABLE,
  },
  entities: MOCK_ENTITY_DEFINITIONS,
};

// Metadata with a variable pointing to a non-existent entity
export const MOCK_METADATA_MISSING_ENTITY = {
  variables: { foo: { name: 'foo', entity: 'missing_entity' } },
  entities: {},
};

// Base household for VariableResolver tests
export const MOCK_RESOLVER_HOUSEHOLD: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    { age: 30, employment_income: 50000 },
    { age: 25, employment_income: 30000 },
  ],
  household: { state_name: 'CA' },
  tax_unit: { is_tax_unit_head: true },
};
