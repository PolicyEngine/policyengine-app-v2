import { CURRENT_YEAR } from '@/constants';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';

// ============= TEST CONSTANTS =============

// Person names and IDs
export const PERSON_NAMES = {
  ADULT_1: 'you',
  ADULT_2: 'your partner',
  CHILD_1: 'your first child',
  CHILD_2: 'your second child',
  CHILD_BASE: 'child',
} as const;

// Ages
export const PERSON_AGES = {
  ADULT_DEFAULT: 30,
  ADULT_SENIOR: 65,
  ADULT_YOUNG: 18,
  CHILD_DEFAULT: 10,
  CHILD_TEEN: 16,
  CHILD_TODDLER: 2,
} as const;

// Countries
export const COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  NG: 'ng',
  IL: 'il',
  INVALID: 'xx',
} as const;

// Years
export const YEARS = {
  CURRENT: CURRENT_YEAR,
  PAST: '2023',
  FUTURE: CURRENT_YEAR,
  INVALID: '24',
  INVALID_TEXT: 'year',
} as const;

// Entity names
export const ENTITY_NAMES = {
  PEOPLE: 'people',
  HOUSEHOLDS: 'households',
  FAMILIES: 'families',
  TAX_UNITS: 'taxUnits',
  SPM_UNITS: 'spmUnits',
  MARITAL_UNITS: 'maritalUnits',
  BEN_UNITS: 'benunits',
} as const;

// Group keys
// NOTE: These names must match the conventions from policyengine-app (the legacy app).
// In particular, spm_units uses "your household" as the instance name (not "your spm unit"),
// which is the same key used by the households entity.
export const GROUP_KEYS = {
  DEFAULT_HOUSEHOLD: 'your household',
  DEFAULT_FAMILY: 'your family',
  DEFAULT_TAX_UNIT: 'your tax unit',
  DEFAULT_SPM_UNIT: 'your household', // Same as DEFAULT_HOUSEHOLD - matches legacy policyengine-app
  DEFAULT_MARITAL_UNIT: 'your marital unit',
  DEFAULT_BEN_UNIT: 'your benefit unit',
  CUSTOM_GROUP: 'custom group',
} as const;

// Variable names
export const VARIABLE_NAMES = {
  EMPLOYMENT_INCOME: 'employment_income',
  IS_MARRIED: 'is_married',
  IS_TAX_UNIT_DEPENDENT: 'is_tax_unit_dependent',
  STATE_CODE: 'state_code',
  CUSTOM_VAR: 'custom_variable',
} as const;

// Variable values
export const VARIABLE_VALUES = {
  INCOME_DEFAULT: 50000,
  INCOME_HIGH: 100000,
  INCOME_LOW: 20000,
  STATE_CA: 'CA',
  STATE_NY: 'NY',
  BOOLEAN_TRUE: true,
  BOOLEAN_FALSE: false,
  STRING_VALUE: 'test value',
  NUMBER_VALUE: 42,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_YEAR: 'currentYear must be a four-digit year string',
  YEAR_FORMAT: 'Year must be a four-digit string',
  PERSON_NOT_FOUND: (name: string) => `Person ${name} not found`,
  GROUP_NOT_FOUND: (group: string, entity: string) => `Group ${group} not found in ${entity}`,
} as const;

// ============= MOCK DATA OBJECTS =============

// Expected country default entities
export const EXPECTED_COUNTRY_ENTITIES = {
  us: ['people', 'families', 'taxUnits', 'spmUnits', 'households', 'maritalUnits'],
  uk: ['people', 'benunits', 'households'],
  ca: ['people', 'households'],
  ng: ['people', 'households'],
  il: ['people', 'households'],
} as const;

// Mock person data
export const mockAdultPerson: HouseholdPerson = {
  person_id: 0,
  age: PERSON_AGES.ADULT_DEFAULT,
};

export const mockAdultWithIncome: HouseholdPerson = {
  person_id: 0,
  age: PERSON_AGES.ADULT_DEFAULT,
  [VARIABLE_NAMES.EMPLOYMENT_INCOME]: VARIABLE_VALUES.INCOME_DEFAULT,
};

export const mockChildPerson: HouseholdPerson = {
  person_id: 0,
  age: PERSON_AGES.CHILD_DEFAULT,
};

export const mockChildUSDependent: HouseholdPerson = {
  person_id: 0,
  age: PERSON_AGES.CHILD_DEFAULT,
  [VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]: VARIABLE_VALUES.BOOLEAN_TRUE,
};

// Mock household structures
export const createEmptyHousehold = (countryId: string): Household => {
  const modelName =
    countryId === 'us'
      ? 'policyengine_us'
      : countryId === 'uk'
        ? 'policyengine_uk'
        : 'policyengine_us';

  return {
    tax_benefit_model_name: modelName as any,
    year: parseInt(YEARS.CURRENT),
    people: [],
  };
};

// Mock US household with one adult
export const mockUSHouseholdOneAdult: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(YEARS.CURRENT),
  people: [
    {
      person_id: 0,
      name: PERSON_NAMES.ADULT_1,
      age: PERSON_AGES.ADULT_DEFAULT,
      person_tax_unit_id: 0,
      person_household_id: 0,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
  household: [{ household_id: 0 }],
};

// Mock UK household with one adult
export const mockUKHouseholdOneAdult: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(YEARS.CURRENT),
  people: [
    {
      person_id: 0,
      name: PERSON_NAMES.ADULT_1,
      age: PERSON_AGES.ADULT_DEFAULT,
      person_benunit_id: 0,
      person_household_id: 0,
    },
  ],
  benunit: [{ benunit_id: 0 }],
  household: [{ household_id: 0 }],
};

// Mock US household with married couple
export const mockUSHouseholdMarried: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(YEARS.CURRENT),
  people: [
    {
      person_id: 0,
      name: PERSON_NAMES.ADULT_1,
      age: PERSON_AGES.ADULT_DEFAULT,
      person_tax_unit_id: 0,
      person_household_id: 0,
      person_marital_unit_id: 0,
    },
    {
      person_id: 1,
      name: PERSON_NAMES.ADULT_2,
      age: PERSON_AGES.ADULT_DEFAULT,
      person_tax_unit_id: 0,
      person_household_id: 0,
      person_marital_unit_id: 0,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
  household: [{ household_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }],
};

// Mock household with custom variables
export const mockHouseholdWithVariables: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(YEARS.CURRENT),
  people: [
    {
      person_id: 0,
      name: PERSON_NAMES.ADULT_1,
      age: PERSON_AGES.ADULT_DEFAULT,
      [VARIABLE_NAMES.EMPLOYMENT_INCOME]: VARIABLE_VALUES.INCOME_DEFAULT,
      [VARIABLE_NAMES.STATE_CODE]: VARIABLE_VALUES.STATE_CA,
      person_household_id: 0,
    },
  ],
  household: [
    {
      household_id: 0,
      [VARIABLE_NAMES.STATE_CODE]: VARIABLE_VALUES.STATE_CA,
    },
  ],
};

// ============= TEST HELPERS =============

// Helper to verify household structure
export const verifyHouseholdStructure = (household: Household, countryId: string): void => {
  const expectedModelName = countryId === 'us' ? 'policyengine_us' : 'policyengine_uk';
  expect(household.tax_benefit_model_name).toBe(expectedModelName);
  expect(household.people).toBeDefined();
  expect(Array.isArray(household.people)).toBe(true);
};

// Helper to verify person exists in household
export const verifyPersonExists = (
  household: Household,
  personName: string,
  expectedAge?: number
): void => {
  const person = household.people.find((p) => p.name === personName);
  expect(person).toBeDefined();

  if (expectedAge !== undefined && person) {
    expect(person.age).toBe(expectedAge);
  }
};

// Helper to verify person is in group
export const verifyPersonInGroup = (
  household: Household,
  personName: string,
  entityName: string,
  groupKey: string
): void => {
  const person = household.people.find((p) => p.name === personName);
  expect(person).toBeDefined();
  // In v2, group membership is determined by person_{entity}_id
  // This helper is kept for backward compatibility but may need adjustment based on usage
};

// Helper to verify person not in any group
export const verifyPersonNotInAnyGroup = (household: Household, personName: string): void => {
  const person = household.people.find((p) => p.name === personName);
  expect(person).toBeDefined();
  if (person) {
    // In v2, check that person doesn't have any entity relationship IDs set
    expect(person.person_tax_unit_id).toBeUndefined();
    expect(person.person_family_id).toBeUndefined();
    expect(person.person_household_id).toBeUndefined();
  }
};

// Helper to verify variable value
export const verifyVariableValue = (
  entity: any,
  variableName: string,
  expectedValue: any,
  year: string = YEARS.CURRENT
): void => {
  expect(entity[variableName]).toBeDefined();
  // In v2, values are flat, not year-keyed
  expect(entity[variableName]).toBe(expectedValue);
};

// Helper to count people in household
export const countPeople = (household: Household): number => {
  return household.people.length;
};

// Helper to count members in group
export const countGroupMembers = (
  household: Household,
  entityName: string,
  groupKey: string
): number => {
  // In v2, count people assigned to a specific entity ID
  // entityName should be like 'tax_unit', 'household', etc.
  const entityIdField = `person_${entityName}_id` as keyof HouseholdPerson;
  return household.people.filter((p) => p[entityIdField] !== undefined).length;
};

// Helper to get all group keys for an entity
export const getGroupKeys = (household: Household, entityName: string): string[] => {
  // In v2, entities are arrays with IDs, not keyed objects
  const entities = household[entityName as keyof Household];
  if (!Array.isArray(entities)) {
    return [];
  }
  return entities.map((e: any) => String(e[`${entityName}_id`] ?? ''));
};

// Helper to create mock variables object
export const createMockVariables = (income?: number, state?: string): Record<string, any> => {
  const vars: Record<string, any> = {};

  if (income !== undefined) {
    vars[VARIABLE_NAMES.EMPLOYMENT_INCOME] = income;
  }

  if (state !== undefined) {
    vars[VARIABLE_NAMES.STATE_CODE] = state;
  }

  return vars;
};

// Helper to create year-keyed value
// NOTE: In v2, values are no longer year-keyed. This helper returns the raw value for compatibility.
export const createYearKeyedValue = (value: any, year: string = YEARS.CURRENT): any => {
  return value;
};
