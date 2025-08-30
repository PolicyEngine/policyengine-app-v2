import { Household, HouseholdData, HouseholdPerson, HouseholdGroupEntity } from '@/types/ingredients/Household';

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
  CURRENT: '2024',
  PAST: '2023',
  FUTURE: '2025',
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
export const GROUP_KEYS = {
  DEFAULT_HOUSEHOLD: 'your household',
  DEFAULT_FAMILY: 'your family',
  DEFAULT_TAX_UNIT: 'your tax unit',
  DEFAULT_SPM_UNIT: 'your spm unit',
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
  age: { [YEARS.CURRENT]: PERSON_AGES.ADULT_DEFAULT },
};

export const mockAdultWithIncome: HouseholdPerson = {
  age: { [YEARS.CURRENT]: PERSON_AGES.ADULT_DEFAULT },
  [VARIABLE_NAMES.EMPLOYMENT_INCOME]: { [YEARS.CURRENT]: VARIABLE_VALUES.INCOME_DEFAULT },
};

export const mockChildPerson: HouseholdPerson = {
  age: { [YEARS.CURRENT]: PERSON_AGES.CHILD_DEFAULT },
};

export const mockChildUSDependent: HouseholdPerson = {
  age: { [YEARS.CURRENT]: PERSON_AGES.CHILD_DEFAULT },
  [VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]: { [YEARS.CURRENT]: VARIABLE_VALUES.BOOLEAN_TRUE },
};

// Mock household structures
export const createEmptyHouseholdData = (countryId: string): HouseholdData => {
  const data: HouseholdData = {
    people: {},
  };

  const entities = EXPECTED_COUNTRY_ENTITIES[countryId as keyof typeof EXPECTED_COUNTRY_ENTITIES] || ['people', 'households'];
  
  for (const entity of entities) {
    if (entity !== 'people') {
      data[entity] = {};
    }
  }

  return data;
};

export const createEmptyHousehold = (countryId: string): Household => ({
  countryId: countryId as any,
  householdData: createEmptyHouseholdData(countryId),
});

// Mock US household with one adult
export const mockUSHouseholdOneAdult: Household = {
  countryId: COUNTRIES.US as any,
  householdData: {
    people: {
      [PERSON_NAMES.ADULT_1]: mockAdultPerson,
    },
    families: {},
    taxUnits: {
      [GROUP_KEYS.DEFAULT_TAX_UNIT]: {
        members: [PERSON_NAMES.ADULT_1],
      },
    },
    spmUnits: {},
    households: {
      [GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [PERSON_NAMES.ADULT_1],
      },
    },
    maritalUnits: {},
  },
};

// Mock UK household with one adult
export const mockUKHouseholdOneAdult: Household = {
  countryId: COUNTRIES.UK as any,
  householdData: {
    people: {
      [PERSON_NAMES.ADULT_1]: mockAdultPerson,
    },
    benunits: {
      [GROUP_KEYS.DEFAULT_BEN_UNIT]: {
        members: [PERSON_NAMES.ADULT_1],
      },
    },
    households: {
      [GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [PERSON_NAMES.ADULT_1],
      },
    },
  },
};

// Mock US household with married couple
export const mockUSHouseholdMarried: Household = {
  countryId: COUNTRIES.US as any,
  householdData: {
    people: {
      [PERSON_NAMES.ADULT_1]: mockAdultPerson,
      [PERSON_NAMES.ADULT_2]: mockAdultPerson,
    },
    families: {},
    taxUnits: {
      [GROUP_KEYS.DEFAULT_TAX_UNIT]: {
        members: [PERSON_NAMES.ADULT_1, PERSON_NAMES.ADULT_2],
      },
    },
    spmUnits: {},
    households: {
      [GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [PERSON_NAMES.ADULT_1, PERSON_NAMES.ADULT_2],
      },
    },
    maritalUnits: {
      [GROUP_KEYS.DEFAULT_MARITAL_UNIT]: {
        members: [PERSON_NAMES.ADULT_1, PERSON_NAMES.ADULT_2],
      },
    },
  },
};

// Mock household with custom variables
export const mockHouseholdWithVariables: Household = {
  countryId: COUNTRIES.US as any,
  householdData: {
    people: {
      [PERSON_NAMES.ADULT_1]: {
        age: { [YEARS.CURRENT]: PERSON_AGES.ADULT_DEFAULT },
        [VARIABLE_NAMES.EMPLOYMENT_INCOME]: { [YEARS.CURRENT]: VARIABLE_VALUES.INCOME_DEFAULT },
        [VARIABLE_NAMES.STATE_CODE]: { [YEARS.CURRENT]: VARIABLE_VALUES.STATE_CA },
      },
    },
    households: {
      [GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [PERSON_NAMES.ADULT_1],
        [VARIABLE_NAMES.STATE_CODE]: { [YEARS.CURRENT]: VARIABLE_VALUES.STATE_CA },
      },
    },
  },
};

// ============= TEST HELPERS =============

// Helper to verify household structure
export const verifyHouseholdStructure = (household: Household, countryId: string): void => {
  expect(household.countryId).toBe(countryId);
  expect(household.householdData).toBeDefined();
  expect(household.householdData.people).toBeDefined();
  
  const expectedEntities = EXPECTED_COUNTRY_ENTITIES[countryId as keyof typeof EXPECTED_COUNTRY_ENTITIES];
  if (expectedEntities) {
    for (const entity of expectedEntities) {
      if (entity !== 'people') {
        expect(household.householdData[entity]).toBeDefined();
      }
    }
  }
};

// Helper to verify person exists in household
export const verifyPersonExists = (
  household: Household,
  personName: string,
  expectedAge?: number
): void => {
  const person = household.householdData.people[personName];
  expect(person).toBeDefined();
  
  if (expectedAge !== undefined) {
    const ageValues = Object.values(person.age);
    expect(ageValues[0]).toBe(expectedAge);
  }
};

// Helper to verify person is in group
export const verifyPersonInGroup = (
  household: Household,
  personName: string,
  entityName: string,
  groupKey: string
): void => {
  const entities = household.householdData[entityName] as Record<string, HouseholdGroupEntity>;
  expect(entities).toBeDefined();
  expect(entities[groupKey]).toBeDefined();
  expect(entities[groupKey].members).toContain(personName);
};

// Helper to verify person not in any group
export const verifyPersonNotInAnyGroup = (
  household: Household,
  personName: string
): void => {
  Object.keys(household.householdData).forEach((entityName) => {
    if (entityName === 'people') {
      return;
    }
    
    const entities = household.householdData[entityName] as Record<string, HouseholdGroupEntity>;
    Object.values(entities).forEach((group) => {
      if (group.members) {
        expect(group.members).not.toContain(personName);
      }
    });
  });
};

// Helper to verify variable value
export const verifyVariableValue = (
  entity: any,
  variableName: string,
  expectedValue: any,
  year: string = YEARS.CURRENT
): void => {
  expect(entity[variableName]).toBeDefined();
  expect(entity[variableName][year]).toBe(expectedValue);
};

// Helper to count people in household
export const countPeople = (household: Household): number => {
  return Object.keys(household.householdData.people).length;
};

// Helper to count members in group
export const countGroupMembers = (
  household: Household,
  entityName: string,
  groupKey: string
): number => {
  const entities = household.householdData[entityName] as Record<string, HouseholdGroupEntity>;
  if (!entities || !entities[groupKey]) {
    return 0;
  }
  return entities[groupKey].members?.length || 0;
};

// Helper to get all group keys for an entity
export const getGroupKeys = (household: Household, entityName: string): string[] => {
  const entities = household.householdData[entityName];
  if (!entities || typeof entities !== 'object') {
    return [];
  }
  return Object.keys(entities);
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
export const createYearKeyedValue = (value: any, year: string = YEARS.CURRENT): Record<string, any> => {
  return { [year]: value };
};