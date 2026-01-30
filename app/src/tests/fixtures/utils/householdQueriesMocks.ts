import { CURRENT_YEAR } from '@/constants';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';

// ============= TEST CONSTANTS =============

// Person IDs (v2 uses numeric IDs)
export const QUERY_PERSON_IDS = {
  ADULT_1: 0,
  ADULT_2: 1,
  CHILD_1: 2,
  CHILD_2: 3,
  ADULT_3: 4,
  TEEN: 0,
  BABY: 0,
} as const;

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

// Empty household
export const mockEmptyHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [],
};

// Household with 2 adults and 2 children
export const mockHouseholdTwoAdultsTwoChildren: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [
    {
      person_id: 0,
      name: QUERY_PERSON_NAMES.ADULT_1,
      age: QUERY_AGES.ADULT_30,
      [QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME]: QUERY_VARIABLE_VALUES.INCOME_50K,
      person_household_id: 0,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_spm_unit_id: 0,
      person_marital_unit_id: 0,
    },
    {
      person_id: 1,
      name: QUERY_PERSON_NAMES.ADULT_2,
      age: QUERY_AGES.ADULT_25,
      [QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME]: QUERY_VARIABLE_VALUES.INCOME_75K,
      person_household_id: 0,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_spm_unit_id: 0,
      person_marital_unit_id: 0,
    },
    {
      person_id: 2,
      name: QUERY_PERSON_NAMES.CHILD_1,
      age: QUERY_AGES.CHILD_10,
      [QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]: QUERY_VARIABLE_VALUES.BOOLEAN_TRUE,
      person_household_id: 0,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_spm_unit_id: 0,
    },
    {
      person_id: 3,
      name: QUERY_PERSON_NAMES.CHILD_2,
      age: QUERY_AGES.CHILD_5,
      [QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]: QUERY_VARIABLE_VALUES.BOOLEAN_TRUE,
      person_household_id: 0,
      person_family_id: 0,
      person_tax_unit_id: 0,
      person_spm_unit_id: 0,
    },
  ],
  household: [
    {
      household_id: 0,
      state_fips: 6, // California
    },
  ],
  family: [{ family_id: 0 }],
  tax_unit: [
    {
      tax_unit_id: 0,
      [QUERY_VARIABLE_NAMES.STATE_CODE]: QUERY_VARIABLE_VALUES.STATE_CA,
    },
  ],
  spm_unit: [{ spm_unit_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }],
};

// UK household with benefit units
export const mockUKHousehold: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: 2024,
  people: [
    {
      person_id: 0,
      name: QUERY_PERSON_NAMES.ADULT_1,
      age: QUERY_AGES.ADULT_30,
      [QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME]: QUERY_VARIABLE_VALUES.INCOME_50K,
      person_household_id: 0,
      person_benunit_id: 0,
    },
    {
      person_id: 1,
      name: QUERY_PERSON_NAMES.CHILD_1,
      age: QUERY_AGES.CHILD_10,
      person_household_id: 0,
      person_benunit_id: 0,
    },
  ],
  household: [
    {
      household_id: 0,
      region: 'LONDON',
    },
  ],
  benunit: [{ benunit_id: 0 }],
};

// ============= TEST HELPERS =============

/**
 * Helper to create a household with specific people
 */
export const createHouseholdWithPeople = (
  people: HouseholdPerson[],
  modelName: 'policyengine_us' | 'policyengine_uk' = 'policyengine_us'
): Household => ({
  tax_benefit_model_name: modelName,
  year: 2024,
  people,
  household: [{ household_id: 0 }],
});

/**
 * Helper to create a person with age
 */
export const createPersonWithAge = (
  personId: number,
  name: string,
  age: number
): HouseholdPerson => ({
  person_id: personId,
  name,
  age,
});

/**
 * Helper to create a person with variable
 */
export const createPersonWithVariable = (
  personId: number,
  name: string,
  variableName: string,
  value: any
): HouseholdPerson => ({
  person_id: personId,
  name,
  age: QUERY_AGES.ADULT_30,
  [variableName]: value,
});
