import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import { PersonWithName } from '@/utils/HouseholdQueries';

// ============= TEST CONSTANTS =============

// Person names
export const QUERY_PERSON_NAMES = {
  ADULT_1: 'John',
  ADULT_2: 'Jane',
  ADULT_3: 'Bob',
  CHILD_1: 'Jack',
  CHILD_2: 'Jill',
  TEEN: 'Teen',
  BABY: 'Baby',
} as const;

// Ages
export const QUERY_AGES = {
  ADULT_30: 30,
  ADULT_25: 25,
  ADULT_65: 65,
  ADULT_EXACTLY_18: 18,
  CHILD_10: 10,
  CHILD_5: 5,
  CHILD_ALMOST_18: 17,
  BABY_1: 1,
} as const;

// Countries
export const QUERY_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// Years
export const QUERY_YEARS = {
  CURRENT: '2024',
  PAST: '2023',
  FUTURE: '2025',
  NON_EXISTENT: '2026',
} as const;

// Entity names
export const QUERY_ENTITY_NAMES = {
  PEOPLE: 'people',
  HOUSEHOLDS: 'households',
  FAMILIES: 'families',
  TAX_UNITS: 'taxUnits',
  BEN_UNITS: 'benunits',
  NON_EXISTENT: 'nonExistentEntity',
} as const;

// Group keys
export const QUERY_GROUP_KEYS = {
  DEFAULT_HOUSEHOLD: 'your household',
  DEFAULT_FAMILY: 'your family',
  DEFAULT_TAX_UNIT: 'your tax unit',
  DEFAULT_BEN_UNIT: 'your benefit unit',
  SECOND_HOUSEHOLD: 'second household',
  NON_EXISTENT: 'nonExistentGroup',
} as const;

// Variable names
export const QUERY_VARIABLE_NAMES = {
  EMPLOYMENT_INCOME: 'employment_income',
  IS_MARRIED: 'is_married',
  IS_TAX_UNIT_DEPENDENT: 'is_tax_unit_dependent',
  STATE_CODE: 'state_code',
  NON_EXISTENT: 'non_existent_variable',
  MULTI_YEAR: 'multi_year_variable',
} as const;

// Variable values
export const QUERY_VARIABLE_VALUES = {
  INCOME_50K: 50000,
  INCOME_75K: 75000,
  INCOME_100K: 100000,
  BOOLEAN_TRUE: true,
  BOOLEAN_FALSE: false,
  STATE_CA: 'CA',
  STATE_NY: 'NY',
  STRING_VALUE: 'test value',
  NUMBER_VALUE: 42,
  NULL_VALUE: null,
} as const;

// Expected counts
export const QUERY_EXPECTED_COUNTS = {
  TWO_ADULTS_TWO_CHILDREN: {
    TOTAL: 4,
    ADULTS: 2,
    CHILDREN: 2,
  },
  THREE_ADULTS_ONE_CHILD: {
    TOTAL: 4,
    ADULTS: 3,
    CHILDREN: 1,
  },
  EMPTY: {
    TOTAL: 0,
    ADULTS: 0,
    CHILDREN: 0,
  },
  ONE_ADULT: {
    TOTAL: 1,
    ADULTS: 1,
    CHILDREN: 0,
  },
} as const;

// ============= MOCK DATA OBJECTS =============

// Mock person objects
export const mockAdult30: HouseholdPerson = {
  age: { [QUERY_YEARS.CURRENT]: QUERY_AGES.ADULT_30 },
  [QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME]: { [QUERY_YEARS.CURRENT]: QUERY_VARIABLE_VALUES.INCOME_50K },
};

export const mockAdult25: HouseholdPerson = {
  age: { [QUERY_YEARS.CURRENT]: QUERY_AGES.ADULT_25 },
  [QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME]: { [QUERY_YEARS.CURRENT]: QUERY_VARIABLE_VALUES.INCOME_75K },
};

export const mockChild10: HouseholdPerson = {
  age: { [QUERY_YEARS.CURRENT]: QUERY_AGES.CHILD_10 },
  [QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]: { [QUERY_YEARS.CURRENT]: QUERY_VARIABLE_VALUES.BOOLEAN_TRUE },
};

export const mockChild5: HouseholdPerson = {
  age: { [QUERY_YEARS.CURRENT]: QUERY_AGES.CHILD_5 },
  [QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]: { [QUERY_YEARS.CURRENT]: QUERY_VARIABLE_VALUES.BOOLEAN_TRUE },
};

// Person with age changing over years
export const mockPersonAgeChanging: HouseholdPerson = {
  age: {
    [QUERY_YEARS.PAST]: QUERY_AGES.CHILD_ALMOST_18,
    [QUERY_YEARS.CURRENT]: QUERY_AGES.ADULT_EXACTLY_18,
    [QUERY_YEARS.FUTURE]: QUERY_AGES.ADULT_25,
  },
};

// Person with multi-year variables
export const mockPersonMultiYear: HouseholdPerson = {
  age: { [QUERY_YEARS.CURRENT]: QUERY_AGES.ADULT_30 },
  [QUERY_VARIABLE_NAMES.MULTI_YEAR]: {
    [QUERY_YEARS.PAST]: QUERY_VARIABLE_VALUES.NUMBER_VALUE,
    [QUERY_YEARS.CURRENT]: QUERY_VARIABLE_VALUES.STRING_VALUE,
    [QUERY_YEARS.FUTURE]: QUERY_VARIABLE_VALUES.BOOLEAN_TRUE,
  },
};

// Empty household
export const mockEmptyHousehold: Household = {
  countryId: QUERY_COUNTRIES.US as any,
  householdData: {
    people: {},
    households: {},
  },
};

// Household with 2 adults and 2 children
export const mockHouseholdTwoAdultsTwoChildren: Household = {
  countryId: QUERY_COUNTRIES.US as any,
  householdData: {
    people: {
      [QUERY_PERSON_NAMES.ADULT_1]: mockAdult30,
      [QUERY_PERSON_NAMES.ADULT_2]: mockAdult25,
      [QUERY_PERSON_NAMES.CHILD_1]: mockChild10,
      [QUERY_PERSON_NAMES.CHILD_2]: mockChild5,
    },
    households: {
      [QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_2,
          QUERY_PERSON_NAMES.CHILD_1,
          QUERY_PERSON_NAMES.CHILD_2,
        ],
        [QUERY_VARIABLE_NAMES.STATE_CODE]: { [QUERY_YEARS.CURRENT]: QUERY_VARIABLE_VALUES.STATE_CA },
      },
    },
    families: {
      [QUERY_GROUP_KEYS.DEFAULT_FAMILY]: {
        members: [
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_2,
          QUERY_PERSON_NAMES.CHILD_1,
          QUERY_PERSON_NAMES.CHILD_2,
        ],
      },
    },
    taxUnits: {
      [QUERY_GROUP_KEYS.DEFAULT_TAX_UNIT]: {
        members: [
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_2,
          QUERY_PERSON_NAMES.CHILD_1,
          QUERY_PERSON_NAMES.CHILD_2,
        ],
      },
    },
  },
};

// Household with person whose age changes (child to adult)
export const mockHouseholdAgeTransition: Household = {
  countryId: QUERY_COUNTRIES.US as any,
  householdData: {
    people: {
      [QUERY_PERSON_NAMES.TEEN]: mockPersonAgeChanging,
    },
    households: {
      [QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [QUERY_PERSON_NAMES.TEEN],
      },
    },
  },
};

// Household with multi-year variables
export const mockHouseholdMultiYear: Household = {
  countryId: QUERY_COUNTRIES.US as any,
  householdData: {
    people: {
      [QUERY_PERSON_NAMES.ADULT_1]: mockPersonMultiYear,
    },
    households: {
      [QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [QUERY_PERSON_NAMES.ADULT_1],
      },
    },
  },
};

// Household with multiple groups
export const mockHouseholdMultipleGroups: Household = {
  countryId: QUERY_COUNTRIES.US as any,
  householdData: {
    people: {
      [QUERY_PERSON_NAMES.ADULT_1]: mockAdult30,
      [QUERY_PERSON_NAMES.ADULT_2]: mockAdult25,
      [QUERY_PERSON_NAMES.ADULT_3]: {
        age: { [QUERY_YEARS.CURRENT]: QUERY_AGES.ADULT_65 },
      },
    },
    households: {
      [QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.ADULT_2],
      },
      [QUERY_GROUP_KEYS.SECOND_HOUSEHOLD]: {
        members: [QUERY_PERSON_NAMES.ADULT_3],
      },
    },
  },
};

// UK household with benefit units
export const mockUKHousehold: Household = {
  countryId: QUERY_COUNTRIES.UK as any,
  householdData: {
    people: {
      [QUERY_PERSON_NAMES.ADULT_1]: mockAdult30,
      [QUERY_PERSON_NAMES.CHILD_1]: mockChild10,
    },
    households: {
      [QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.CHILD_1],
      },
    },
    benunits: {
      [QUERY_GROUP_KEYS.DEFAULT_BEN_UNIT]: {
        members: [QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.CHILD_1],
      },
    },
  },
};

// ============= EXPECTED RESULTS =============

// Expected PersonWithName results
export const expectedAdultWithName1: PersonWithName = {
  name: QUERY_PERSON_NAMES.ADULT_1,
  ...mockAdult30,
};

export const expectedAdultWithName2: PersonWithName = {
  name: QUERY_PERSON_NAMES.ADULT_2,
  ...mockAdult25,
};

export const expectedChildWithName1: PersonWithName = {
  name: QUERY_PERSON_NAMES.CHILD_1,
  ...mockChild10,
};

export const expectedChildWithName2: PersonWithName = {
  name: QUERY_PERSON_NAMES.CHILD_2,
  ...mockChild5,
};

export const expectedAllPeopleTwoAdultsTwoChildren: PersonWithName[] = [
  expectedAdultWithName1,
  expectedAdultWithName2,
  expectedChildWithName1,
  expectedChildWithName2,
];

export const expectedAdultsTwoAdultsTwoChildren: PersonWithName[] = [
  expectedAdultWithName1,
  expectedAdultWithName2,
];

export const expectedChildrenTwoAdultsTwoChildren: PersonWithName[] = [
  expectedChildWithName1,
  expectedChildWithName2,
];

// Expected group results
export const expectedGroupsHouseholds = [
  {
    key: QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD,
    members: [
      QUERY_PERSON_NAMES.ADULT_1,
      QUERY_PERSON_NAMES.ADULT_2,
      QUERY_PERSON_NAMES.CHILD_1,
      QUERY_PERSON_NAMES.CHILD_2,
    ],
  },
];

export const expectedGroupsMultiple = [
  {
    key: QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD,
    members: [QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.ADULT_2],
  },
  {
    key: QUERY_GROUP_KEYS.SECOND_HOUSEHOLD,
    members: [QUERY_PERSON_NAMES.ADULT_3],
  },
];

// ============= TEST HELPERS =============

// Helper to create a household with specific people
export const createHouseholdWithPeople = (
  people: Record<string, HouseholdPerson>,
  countryId: string = QUERY_COUNTRIES.US
): Household => ({
  countryId: countryId as any,
  householdData: {
    people,
    households: {
      [QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: Object.keys(people),
      },
    },
  },
});

// Helper to create a person with age
export const createPersonWithAge = (age: number, year: string = QUERY_YEARS.CURRENT): HouseholdPerson => ({
  age: { [year]: age },
});

// Helper to create a person with variable
export const createPersonWithVariable = (
  variableName: string,
  value: any,
  year: string = QUERY_YEARS.CURRENT
): HouseholdPerson => ({
  age: { [year]: QUERY_AGES.ADULT_30 },
  [variableName]: { [year]: value },
});

// Helper to verify PersonWithName
export const verifyPersonWithName = (
  actual: PersonWithName,
  expectedName: string,
  expectedAge?: number,
  year: string = QUERY_YEARS.CURRENT
): void => {
  expect(actual.name).toBe(expectedName);
  if (expectedAge !== undefined) {
    expect(actual.age[year]).toBe(expectedAge);
  }
};

// Helper to verify array of PersonWithName
export const verifyPeopleArray = (
  actual: PersonWithName[],
  expectedNames: string[]
): void => {
  expect(actual).toHaveLength(expectedNames.length);
  const actualNames = actual.map(p => p.name).sort();
  const sortedExpectedNames = [...expectedNames].sort();
  expect(actualNames).toEqual(sortedExpectedNames);
};