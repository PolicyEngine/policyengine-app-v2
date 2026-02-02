import { CURRENT_YEAR } from '@/constants';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';

// ============= TEST CONSTANTS =============

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
  PERSON_NOT_FOUND: (index: number) => `Person at index ${index} not found`,
} as const;

// ============= MOCK DATA OBJECTS =============

// Mock person data (no person_id, name, or person_*_id)
export const mockAdultPerson: HouseholdPerson = {
  age: PERSON_AGES.ADULT_DEFAULT,
};

export const mockAdultWithIncome: HouseholdPerson = {
  age: PERSON_AGES.ADULT_DEFAULT,
  [VARIABLE_NAMES.EMPLOYMENT_INCOME]: VARIABLE_VALUES.INCOME_DEFAULT,
};

export const mockChildPerson: HouseholdPerson = {
  age: PERSON_AGES.CHILD_DEFAULT,
};

export const mockChildUSDependent: HouseholdPerson = {
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
    year: parseInt(YEARS.CURRENT, 10),
    people: [],
  };
};

// Mock US household with one adult (entity groups are single dicts)
export const mockUSHouseholdOneAdult: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(YEARS.CURRENT, 10),
  people: [
    {
      age: PERSON_AGES.ADULT_DEFAULT,
    },
  ],
  tax_unit: {},
  household: {},
};

// Mock UK household with one adult
export const mockUKHouseholdOneAdult: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(YEARS.CURRENT, 10),
  people: [
    {
      age: PERSON_AGES.ADULT_DEFAULT,
    },
  ],
  benunit: {},
  household: {},
};

// Mock US household with married couple
export const mockUSHouseholdMarried: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(YEARS.CURRENT, 10),
  people: [
    {
      age: PERSON_AGES.ADULT_DEFAULT,
    },
    {
      age: PERSON_AGES.ADULT_DEFAULT,
    },
  ],
  tax_unit: {},
  household: {},
  marital_unit: {},
};

// Mock household with custom variables
export const mockHouseholdWithVariables: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(YEARS.CURRENT, 10),
  people: [
    {
      age: PERSON_AGES.ADULT_DEFAULT,
      [VARIABLE_NAMES.EMPLOYMENT_INCOME]: VARIABLE_VALUES.INCOME_DEFAULT,
    },
  ],
  household: {
    [VARIABLE_NAMES.STATE_CODE]: VARIABLE_VALUES.STATE_CA,
  },
};

// ============= TEST HELPERS =============

// Helper to verify household structure
export const verifyHouseholdStructure = (household: Household, countryId: string): void => {
  const expectedModelName = countryId === 'us' ? 'policyengine_us' : 'policyengine_uk';
  expect(household.tax_benefit_model_name).toBe(expectedModelName);
  expect(household.people).toBeDefined();
  expect(Array.isArray(household.people)).toBe(true);
};

// Helper to verify person exists at index with expected age
export const verifyPersonAtIndex = (
  household: Household,
  index: number,
  expectedAge?: number
): void => {
  const person = household.people[index];
  expect(person).toBeDefined();

  if (expectedAge !== undefined && person) {
    expect(person.age).toBe(expectedAge);
  }
};

// Helper to verify variable value
export const verifyVariableValue = (
  entity: any,
  variableName: string,
  expectedValue: any
): void => {
  expect(entity[variableName]).toBeDefined();
  expect(entity[variableName]).toBe(expectedValue);
};

// Helper to count people in household
export const countPeople = (household: Household): number => {
  return household.people.length;
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
