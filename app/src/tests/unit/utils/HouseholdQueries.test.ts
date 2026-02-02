import { describe, expect, test } from 'vitest';
import {
  createHouseholdWithPeople,
  createPersonWithAge,
  createPersonWithVariable,
  mockEmptyHousehold,
  mockHouseholdTwoAdultsTwoChildren,
  mockUKHousehold,
  QUERY_AGES,
  QUERY_EXPECTED_COUNTS,
  QUERY_PERSON_INDICES,
  QUERY_VARIABLE_NAMES,
  QUERY_VARIABLE_VALUES,
} from '@/tests/fixtures/utils/householdQueriesMocks';
import {
  avgPersonVariable,
  getAdultCount,
  getAdults,
  getAllPeople,
  getChildCount,
  getChildren,
  getEntityByType,
  getEntityVariable,
  getHouseholdUnit,
  getModelName,
  getPersonByIndex,
  getPersonCount,
  getPersonVariable,
  getRegion,
  getStateCode,
  getStateFips,
  getYear,
  hasPeople,
  isEmpty,
  isUKHousehold,
  isUSHousehold,
  setPersonVariable,
  sumPersonVariable,
} from '@/utils/HouseholdQueries';

describe('HouseholdQueries', () => {
  describe('getAllPeople', () => {
    test('given empty household when getting all people then returns empty array', () => {
      // When
      const result = getAllPeople(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with people when getting all then returns all people', () => {
      // When
      const result = getAllPeople(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.TOTAL);
      expect(result[QUERY_PERSON_INDICES.ADULT_1].age).toBe(QUERY_AGES.ADULT_30);
      expect(result[QUERY_PERSON_INDICES.ADULT_2].age).toBe(QUERY_AGES.ADULT_25);
      expect(result[QUERY_PERSON_INDICES.CHILD_1].age).toBe(QUERY_AGES.CHILD_10);
      expect(result[QUERY_PERSON_INDICES.CHILD_2].age).toBe(QUERY_AGES.CHILD_5);
    });

    test('given single person household when getting all then returns one person', () => {
      // Given
      const household = createHouseholdWithPeople([createPersonWithAge(QUERY_AGES.ADULT_30)]);

      // When
      const result = getAllPeople(household);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.ONE_ADULT.TOTAL);
      expect(result[0].age).toBe(QUERY_AGES.ADULT_30);
    });
  });

  describe('getPersonByIndex', () => {
    test('given existing person index when getting person then returns person', () => {
      // When
      const result = getPersonByIndex(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_INDICES.ADULT_1
      );

      // Then
      expect(result).toBeDefined();
      expect(result?.age).toBe(QUERY_AGES.ADULT_30);
    });

    test('given non-existent person index when getting person then returns undefined', () => {
      // When
      const result = getPersonByIndex(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });

    test('given empty household when getting person then returns undefined', () => {
      // When
      const result = getPersonByIndex(mockEmptyHousehold, QUERY_PERSON_INDICES.ADULT_1);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getAdults', () => {
    test('given household with adults and children when getting adults then returns only adults', () => {
      // When
      const result = getAdults(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.ADULTS);
      expect(result[0].age).toBe(QUERY_AGES.ADULT_30);
      expect(result[1].age).toBe(QUERY_AGES.ADULT_25);
    });

    test('given empty household when getting adults then returns empty array', () => {
      // When
      const result = getAdults(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with only children when getting adults then returns empty array', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(QUERY_AGES.CHILD_10),
        createPersonWithAge(QUERY_AGES.CHILD_5),
      ]);

      // When
      const result = getAdults(household);

      // Then
      expect(result).toEqual([]);
    });

    test('given 18-year-old when getting adults then includes them', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(QUERY_AGES.ADULT_EXACTLY_18),
      ]);

      // When
      const result = getAdults(household);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].age).toBe(QUERY_AGES.ADULT_EXACTLY_18);
    });
  });

  describe('getChildren', () => {
    test('given household with adults and children when getting children then returns only children', () => {
      // When
      const result = getChildren(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.CHILDREN);
      expect(result[0].age).toBe(QUERY_AGES.CHILD_10);
      expect(result[1].age).toBe(QUERY_AGES.CHILD_5);
    });

    test('given empty household when getting children then returns empty array', () => {
      // When
      const result = getChildren(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with only adults when getting children then returns empty array', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(QUERY_AGES.ADULT_30),
        createPersonWithAge(QUERY_AGES.ADULT_25),
      ]);

      // When
      const result = getChildren(household);

      // Then
      expect(result).toEqual([]);
    });

    test('given 17-year-old when getting children then includes them', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(QUERY_AGES.CHILD_ALMOST_18),
      ]);

      // When
      const result = getChildren(household);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].age).toBe(QUERY_AGES.CHILD_ALMOST_18);
    });
  });

  describe('getPersonVariable', () => {
    test('given existing person and variable when getting variable then returns value', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_INDICES.ADULT_1,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.INCOME_50K);
    });

    test('given non-existent person when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        999,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent variable when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_INDICES.ADULT_1,
        QUERY_VARIABLE_NAMES.NON_EXISTENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given boolean variable when getting variable then returns boolean value', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_INDICES.CHILD_1,
        QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.BOOLEAN_TRUE);
    });
  });

  describe('setPersonVariable', () => {
    test('given existing person when setting variable then variable is updated', () => {
      // Given
      const household = createHouseholdWithPeople([createPersonWithAge(QUERY_AGES.ADULT_30)]);

      // When
      setPersonVariable(household, 0, QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, 60000);

      // Then
      expect(household.people[0][QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME]).toBe(60000);
    });

    test('given non-existent person when setting variable then household is unchanged', () => {
      // Given
      const household = createHouseholdWithPeople([createPersonWithAge(QUERY_AGES.ADULT_30)]);
      const beforeLength = household.people.length;

      // When
      setPersonVariable(household, 999, QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, 60000);

      // Then
      expect(household.people.length).toBe(beforeLength);
    });
  });

  describe('getPersonCount', () => {
    test('given empty household when counting people then returns zero', () => {
      // When
      const result = getPersonCount(mockEmptyHousehold);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.TOTAL);
    });

    test('given household with people when counting then returns correct count', () => {
      // When
      const result = getPersonCount(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.TOTAL);
    });

    test('given single person household when counting then returns one', () => {
      // Given
      const household = createHouseholdWithPeople([createPersonWithAge(QUERY_AGES.ADULT_30)]);

      // When
      const result = getPersonCount(household);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.ONE_ADULT.TOTAL);
    });
  });

  describe('getAdultCount', () => {
    test('given household with adults and children when counting adults then returns adult count', () => {
      // When
      const result = getAdultCount(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.ADULTS);
    });

    test('given empty household when counting adults then returns zero', () => {
      // When
      const result = getAdultCount(mockEmptyHousehold);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.ADULTS);
    });

    test('given household with only children when counting adults then returns zero', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(QUERY_AGES.CHILD_10),
        createPersonWithAge(QUERY_AGES.CHILD_5),
      ]);

      // When
      const result = getAdultCount(household);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('getChildCount', () => {
    test('given household with adults and children when counting children then returns child count', () => {
      // When
      const result = getChildCount(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.CHILDREN);
    });

    test('given empty household when counting children then returns zero', () => {
      // When
      const result = getChildCount(mockEmptyHousehold);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.CHILDREN);
    });

    test('given household with only adults when counting children then returns zero', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(QUERY_AGES.ADULT_30),
        createPersonWithAge(QUERY_AGES.ADULT_25),
      ]);

      // When
      const result = getChildCount(household);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('isEmpty', () => {
    test('given empty household when checking if empty then returns true', () => {
      // When
      const result = isEmpty(mockEmptyHousehold);

      // Then
      expect(result).toBe(true);
    });

    test('given household with people when checking if empty then returns false', () => {
      // When
      const result = isEmpty(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(false);
    });

    test('given single person household when checking if empty then returns false', () => {
      // Given
      const household = createHouseholdWithPeople([createPersonWithAge(QUERY_AGES.ADULT_30)]);

      // When
      const result = isEmpty(household);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('hasPeople', () => {
    test('given empty household when checking has people then returns false', () => {
      // When
      const result = hasPeople(mockEmptyHousehold);

      // Then
      expect(result).toBe(false);
    });

    test('given household with people when checking has people then returns true', () => {
      // When
      const result = hasPeople(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('getEntityByType', () => {
    test('given household entity type when getting entity then returns household dict', () => {
      // When
      const result = getEntityByType(mockHouseholdTwoAdultsTwoChildren, 'household');

      // Then
      expect(result).toBeDefined();
      expect(result?.state_fips).toBe(6);
    });

    test('given tax_unit entity type when getting entity then returns tax_unit dict', () => {
      // When
      const result = getEntityByType(mockHouseholdTwoAdultsTwoChildren, 'tax_unit');

      // Then
      expect(result).toBeDefined();
      expect(result?.state_code).toBe(QUERY_VARIABLE_VALUES.STATE_CA);
    });

    test('given person entity type when getting entity then returns undefined', () => {
      // When
      const result = getEntityByType(mockHouseholdTwoAdultsTwoChildren, 'person');

      // Then
      expect(result).toBeUndefined();
    });

    test('given benunit entity type when getting entity then returns benunit dict', () => {
      // When
      const result = getEntityByType(mockUKHousehold, 'benunit');

      // Then
      expect(result).toBeDefined();
    });
  });

  describe('getEntityVariable', () => {
    test('given existing tax_unit and variable when getting variable then returns value', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'tax_unit',
        QUERY_VARIABLE_NAMES.STATE_CODE
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.STATE_CA);
    });

    test('given non-existent variable when getting variable then returns undefined', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'tax_unit',
        QUERY_VARIABLE_NAMES.NON_EXISTENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given household entity type when getting variable then returns value', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'household',
        'state_fips'
      );

      // Then
      expect(result).toBe(6);
    });

    test('given person entity type when getting variable then returns value from first person', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'person',
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.INCOME_50K);
    });
  });

  describe('getHouseholdUnit', () => {
    test('given household with household dict when getting household unit then returns dict', () => {
      // When
      const result = getHouseholdUnit(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBeDefined();
      expect(result?.state_fips).toBe(6);
    });

    test('given household without household dict when getting household unit then returns undefined', () => {
      // When
      const result = getHouseholdUnit(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getYear', () => {
    test('given household when getting year then returns year', () => {
      // When
      const result = getYear(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(2024);
    });
  });

  describe('getModelName', () => {
    test('given US household when getting model name then returns policyengine_us', () => {
      // When
      const result = getModelName(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe('policyengine_us');
    });

    test('given UK household when getting model name then returns policyengine_uk', () => {
      // When
      const result = getModelName(mockUKHousehold);

      // Then
      expect(result).toBe('policyengine_uk');
    });
  });

  describe('isUSHousehold', () => {
    test('given US household when checking if US then returns true', () => {
      // When
      const result = isUSHousehold(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(true);
    });

    test('given UK household when checking if US then returns false', () => {
      // When
      const result = isUSHousehold(mockUKHousehold);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('isUKHousehold', () => {
    test('given UK household when checking if UK then returns true', () => {
      // When
      const result = isUKHousehold(mockUKHousehold);

      // Then
      expect(result).toBe(true);
    });

    test('given US household when checking if UK then returns false', () => {
      // When
      const result = isUKHousehold(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getStateFips', () => {
    test('given household with state FIPS when getting state FIPS then returns state FIPS', () => {
      // When
      const result = getStateFips(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(6);
    });

    test('given household without household dict when getting state FIPS then returns undefined', () => {
      // When
      const result = getStateFips(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getStateCode', () => {
    test('given household with state code when getting state code then returns state code', () => {
      // When
      const result = getStateCode(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.STATE_CA);
    });

    test('given household without tax_unit when getting state code then returns undefined', () => {
      // When
      const result = getStateCode(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getRegion', () => {
    test('given UK household with region when getting region then returns region', () => {
      // When
      const result = getRegion(mockUKHousehold);

      // Then
      expect(result).toBe('LONDON');
    });

    test('given household without household dict when getting region then returns undefined', () => {
      // When
      const result = getRegion(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('sumPersonVariable', () => {
    test('given household with income when summing employment income then returns total', () => {
      // When
      const result = sumPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.INCOME_50K + QUERY_VARIABLE_VALUES.INCOME_75K);
    });

    test('given empty household when summing then returns zero', () => {
      // When
      const result = sumPersonVariable(mockEmptyHousehold, QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME);

      // Then
      expect(result).toBe(0);
    });

    test('given non-existent variable when summing then returns zero', () => {
      // When
      const result = sumPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_VARIABLE_NAMES.NON_EXISTENT
      );

      // Then
      expect(result).toBe(0);
    });

    test('given household with mixed numeric and non-numeric values when summing then only sums numeric', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithVariable(QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, 1000),
        createPersonWithVariable(QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, 2000),
        createPersonWithVariable(QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, undefined),
      ]);

      // When
      const result = sumPersonVariable(household, QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME);

      // Then
      expect(result).toBe(3000);
    });
  });

  describe('avgPersonVariable', () => {
    test('given household with income when averaging employment income then returns average', () => {
      // When
      const result = avgPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      const expectedAvg = (QUERY_VARIABLE_VALUES.INCOME_50K + QUERY_VARIABLE_VALUES.INCOME_75K) / 4;
      expect(result).toBe(expectedAvg);
    });

    test('given empty household when averaging then returns zero', () => {
      // When
      const result = avgPersonVariable(mockEmptyHousehold, QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME);

      // Then
      expect(result).toBe(0);
    });

    test('given household with two people with values when averaging then calculates correctly', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithVariable(QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, 1000),
        createPersonWithVariable(QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME, 2000),
      ]);

      // When
      const result = avgPersonVariable(household, QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME);

      // Then
      expect(result).toBe(1500);
    });
  });
});
