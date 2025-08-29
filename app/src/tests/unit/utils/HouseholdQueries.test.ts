import { describe, test, expect } from 'vitest';
import {
  getAllPeople,
  getAdults,
  getChildren,
  getPersonVariable,
  getGroupVariable,
  getPersonCount,
  getAdultCount,
  getChildCount,
  isEmpty,
  getGroupMembers,
  getGroups,
} from '@/utils/HouseholdQueries';
import {
  QUERY_PERSON_NAMES,
  QUERY_AGES,
  QUERY_YEARS,
  QUERY_ENTITY_NAMES,
  QUERY_GROUP_KEYS,
  QUERY_VARIABLE_NAMES,
  QUERY_VARIABLE_VALUES,
  QUERY_EXPECTED_COUNTS,
  mockEmptyHousehold,
  mockHouseholdTwoAdultsTwoChildren,
  mockHouseholdAgeTransition,
  mockHouseholdMultiYear,
  mockHouseholdMultipleGroups,
  mockUKHousehold,
  expectedAllPeopleTwoAdultsTwoChildren,
  expectedAdultsTwoAdultsTwoChildren,
  expectedChildrenTwoAdultsTwoChildren,
  expectedGroupsHouseholds,
  expectedGroupsMultiple,
  createHouseholdWithPeople,
  createPersonWithAge,
  createPersonWithVariable,
  verifyPersonWithName,
  verifyPeopleArray,
} from '@/tests/fixtures/utils/householdQueriesMocks';

describe('HouseholdQueries', () => {
  describe('getAllPeople', () => {
    test('given empty household when getting all people then returns empty array', () => {
      // When
      const result = getAllPeople(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with people when getting all then returns all people with names', () => {
      // When
      const result = getAllPeople(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.TOTAL);
      verifyPeopleArray(result, [
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_PERSON_NAMES.ADULT_2,
        QUERY_PERSON_NAMES.CHILD_1,
        QUERY_PERSON_NAMES.CHILD_2,
      ]);

      // Verify structure
      const adult1 = result.find(p => p.name === QUERY_PERSON_NAMES.ADULT_1);
      expect(adult1).toBeDefined();
      expect(adult1!.age[QUERY_YEARS.CURRENT]).toBe(QUERY_AGES.ADULT_30);
      expect(adult1![QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME][QUERY_YEARS.CURRENT]).toBe(
        QUERY_VARIABLE_VALUES.INCOME_50K
      );
    });

    test('given single person household when getting all then returns one person', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.ADULT_1]: createPersonWithAge(QUERY_AGES.ADULT_30),
      });

      // When
      const result = getAllPeople(household);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.ONE_ADULT.TOTAL);
      verifyPersonWithName(result[0], QUERY_PERSON_NAMES.ADULT_1, QUERY_AGES.ADULT_30);
    });
  });

  describe('getAdults', () => {
    test('given household with adults and children when getting adults then returns only adults', () => {
      // When
      const result = getAdults(mockHouseholdTwoAdultsTwoChildren, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.ADULTS);
      verifyPeopleArray(result, [QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.ADULT_2]);
    });

    test('given person turning 18 when querying different years then returns correct adults', () => {
      // When - Past year (age 17)
      const pastResult = getAdults(mockHouseholdAgeTransition, QUERY_YEARS.PAST);
      
      // Then
      expect(pastResult).toHaveLength(0);

      // When - Current year (age 18)
      const currentResult = getAdults(mockHouseholdAgeTransition, QUERY_YEARS.CURRENT);
      
      // Then
      expect(currentResult).toHaveLength(1);
      verifyPersonWithName(currentResult[0], QUERY_PERSON_NAMES.TEEN, QUERY_AGES.ADULT_EXACTLY_18, QUERY_YEARS.CURRENT);

      // When - Future year (age 25)
      const futureResult = getAdults(mockHouseholdAgeTransition, QUERY_YEARS.FUTURE);
      
      // Then
      expect(futureResult).toHaveLength(1);
      verifyPersonWithName(futureResult[0], QUERY_PERSON_NAMES.TEEN, QUERY_AGES.ADULT_25, QUERY_YEARS.FUTURE);
    });

    test('given empty household when getting adults then returns empty array', () => {
      // When
      const result = getAdults(mockEmptyHousehold, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with only children when getting adults then returns empty array', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.CHILD_1]: createPersonWithAge(QUERY_AGES.CHILD_10),
        [QUERY_PERSON_NAMES.CHILD_2]: createPersonWithAge(QUERY_AGES.CHILD_5),
      });

      // When
      const result = getAdults(household, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toEqual([]);
    });

    test('given 18-year-old when getting adults then includes them', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.TEEN]: createPersonWithAge(QUERY_AGES.ADULT_EXACTLY_18),
      });

      // When
      const result = getAdults(household, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toHaveLength(1);
      verifyPersonWithName(result[0], QUERY_PERSON_NAMES.TEEN, QUERY_AGES.ADULT_EXACTLY_18);
    });

    test('given non-existent year when getting adults then returns empty array', () => {
      // When
      const result = getAdults(mockHouseholdTwoAdultsTwoChildren, QUERY_YEARS.NON_EXISTENT);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getChildren', () => {
    test('given household with adults and children when getting children then returns only children', () => {
      // When
      const result = getChildren(mockHouseholdTwoAdultsTwoChildren, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.CHILDREN);
      verifyPeopleArray(result, [QUERY_PERSON_NAMES.CHILD_1, QUERY_PERSON_NAMES.CHILD_2]);
    });

    test('given person turning 18 when querying different years then returns correct children', () => {
      // When - Past year (age 17)
      const pastResult = getChildren(mockHouseholdAgeTransition, QUERY_YEARS.PAST);
      
      // Then
      expect(pastResult).toHaveLength(1);
      verifyPersonWithName(pastResult[0], QUERY_PERSON_NAMES.TEEN, QUERY_AGES.CHILD_ALMOST_18, QUERY_YEARS.PAST);

      // When - Current year (age 18)
      const currentResult = getChildren(mockHouseholdAgeTransition, QUERY_YEARS.CURRENT);
      
      // Then
      expect(currentResult).toHaveLength(0);

      // When - Future year (age 25)
      const futureResult = getChildren(mockHouseholdAgeTransition, QUERY_YEARS.FUTURE);
      
      // Then
      expect(futureResult).toHaveLength(0);
    });

    test('given empty household when getting children then returns empty array', () => {
      // When
      const result = getChildren(mockEmptyHousehold, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with only adults when getting children then returns empty array', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.ADULT_1]: createPersonWithAge(QUERY_AGES.ADULT_30),
        [QUERY_PERSON_NAMES.ADULT_2]: createPersonWithAge(QUERY_AGES.ADULT_25),
      });

      // When
      const result = getChildren(household, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toEqual([]);
    });

    test('given 17-year-old when getting children then includes them', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.TEEN]: createPersonWithAge(QUERY_AGES.CHILD_ALMOST_18),
      });

      // When
      const result = getChildren(household, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toHaveLength(1);
      verifyPersonWithName(result[0], QUERY_PERSON_NAMES.TEEN, QUERY_AGES.CHILD_ALMOST_18);
    });

    test('given non-existent year when getting children then returns empty array', () => {
      // When
      const result = getChildren(mockHouseholdTwoAdultsTwoChildren, QUERY_YEARS.NON_EXISTENT);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getPersonVariable', () => {
    test('given existing person and variable when getting variable then returns value', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.INCOME_50K);
    });

    test('given multi-year variable when getting different years then returns correct values', () => {
      // When - Past year
      const pastResult = getPersonVariable(
        mockHouseholdMultiYear,
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_VARIABLE_NAMES.MULTI_YEAR,
        QUERY_YEARS.PAST
      );
      
      // Then
      expect(pastResult).toBe(QUERY_VARIABLE_VALUES.NUMBER_VALUE);

      // When - Current year
      const currentResult = getPersonVariable(
        mockHouseholdMultiYear,
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_VARIABLE_NAMES.MULTI_YEAR,
        QUERY_YEARS.CURRENT
      );
      
      // Then
      expect(currentResult).toBe(QUERY_VARIABLE_VALUES.STRING_VALUE);

      // When - Future year
      const futureResult = getPersonVariable(
        mockHouseholdMultiYear,
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_VARIABLE_NAMES.MULTI_YEAR,
        QUERY_YEARS.FUTURE
      );
      
      // Then
      expect(futureResult).toBe(QUERY_VARIABLE_VALUES.BOOLEAN_TRUE);
    });

    test('given non-existent person when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'non-existent-person',
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent variable when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_VARIABLE_NAMES.NON_EXISTENT,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent year when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME,
        QUERY_YEARS.NON_EXISTENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given boolean variable when getting variable then returns boolean value', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_NAMES.CHILD_1,
        QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.BOOLEAN_TRUE);
    });
  });

  describe('getGroupVariable', () => {
    test('given existing group and variable when getting variable then returns value', () => {
      // When
      const result = getGroupVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD,
        QUERY_VARIABLE_NAMES.STATE_CODE,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.STATE_CA);
    });

    test('given non-existent entity when getting variable then returns undefined', () => {
      // When
      const result = getGroupVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.NON_EXISTENT,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD,
        QUERY_VARIABLE_NAMES.STATE_CODE,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent group when getting variable then returns undefined', () => {
      // When
      const result = getGroupVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.NON_EXISTENT,
        QUERY_VARIABLE_NAMES.STATE_CODE,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent variable when getting variable then returns undefined', () => {
      // When
      const result = getGroupVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD,
        QUERY_VARIABLE_NAMES.NON_EXISTENT,
        QUERY_YEARS.CURRENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent year when getting variable then returns undefined', () => {
      // When
      const result = getGroupVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD,
        QUERY_VARIABLE_NAMES.STATE_CODE,
        QUERY_YEARS.NON_EXISTENT
      );

      // Then
      expect(result).toBeUndefined();
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
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.ADULT_1]: createPersonWithAge(QUERY_AGES.ADULT_30),
      });

      // When
      const result = getPersonCount(household);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.ONE_ADULT.TOTAL);
    });

    test('given multiple groups household when counting then returns total people', () => {
      // When
      const result = getPersonCount(mockHouseholdMultipleGroups);

      // Then
      expect(result).toBe(3);
    });
  });

  describe('getAdultCount', () => {
    test('given household with adults and children when counting adults then returns adult count', () => {
      // When
      const result = getAdultCount(mockHouseholdTwoAdultsTwoChildren, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.ADULTS);
    });

    test('given empty household when counting adults then returns zero', () => {
      // When
      const result = getAdultCount(mockEmptyHousehold, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.ADULTS);
    });

    test('given household with only children when counting adults then returns zero', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.CHILD_1]: createPersonWithAge(QUERY_AGES.CHILD_10),
        [QUERY_PERSON_NAMES.CHILD_2]: createPersonWithAge(QUERY_AGES.CHILD_5),
      });

      // When
      const result = getAdultCount(household, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toBe(0);
    });

    test('given person turning 18 when counting adults in different years then returns correct counts', () => {
      // When/Then
      expect(getAdultCount(mockHouseholdAgeTransition, QUERY_YEARS.PAST)).toBe(0);
      expect(getAdultCount(mockHouseholdAgeTransition, QUERY_YEARS.CURRENT)).toBe(1);
      expect(getAdultCount(mockHouseholdAgeTransition, QUERY_YEARS.FUTURE)).toBe(1);
    });
  });

  describe('getChildCount', () => {
    test('given household with adults and children when counting children then returns child count', () => {
      // When
      const result = getChildCount(mockHouseholdTwoAdultsTwoChildren, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.CHILDREN);
    });

    test('given empty household when counting children then returns zero', () => {
      // When
      const result = getChildCount(mockEmptyHousehold, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.CHILDREN);
    });

    test('given household with only adults when counting children then returns zero', () => {
      // Given
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.ADULT_1]: createPersonWithAge(QUERY_AGES.ADULT_30),
        [QUERY_PERSON_NAMES.ADULT_2]: createPersonWithAge(QUERY_AGES.ADULT_25),
      });

      // When
      const result = getChildCount(household, QUERY_YEARS.CURRENT);

      // Then
      expect(result).toBe(0);
    });

    test('given person turning 18 when counting children in different years then returns correct counts', () => {
      // When/Then
      expect(getChildCount(mockHouseholdAgeTransition, QUERY_YEARS.PAST)).toBe(1);
      expect(getChildCount(mockHouseholdAgeTransition, QUERY_YEARS.CURRENT)).toBe(0);
      expect(getChildCount(mockHouseholdAgeTransition, QUERY_YEARS.FUTURE)).toBe(0);
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
      const household = createHouseholdWithPeople({
        [QUERY_PERSON_NAMES.ADULT_1]: createPersonWithAge(QUERY_AGES.ADULT_30),
      });

      // When
      const result = isEmpty(household);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getGroupMembers', () => {
    test('given existing group when getting members then returns member array', () => {
      // When
      const result = getGroupMembers(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD
      );

      // Then
      expect(result).toEqual([
        QUERY_PERSON_NAMES.ADULT_1,
        QUERY_PERSON_NAMES.ADULT_2,
        QUERY_PERSON_NAMES.CHILD_1,
        QUERY_PERSON_NAMES.CHILD_2,
      ]);
    });

    test('given non-existent entity when getting members then returns empty array', () => {
      // When
      const result = getGroupMembers(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.NON_EXISTENT,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD
      );

      // Then
      expect(result).toEqual([]);
    });

    test('given non-existent group when getting members then returns empty array', () => {
      // When
      const result = getGroupMembers(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.NON_EXISTENT
      );

      // Then
      expect(result).toEqual([]);
    });

    test('given UK household when getting benefit unit members then returns correct members', () => {
      // When
      const result = getGroupMembers(
        mockUKHousehold,
        QUERY_ENTITY_NAMES.BEN_UNITS,
        QUERY_GROUP_KEYS.DEFAULT_BEN_UNIT
      );

      // Then
      expect(result).toEqual([QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.CHILD_1]);
    });

    test('given multiple groups when getting specific group members then returns only that group', () => {
      // When - First household
      const result1 = getGroupMembers(
        mockHouseholdMultipleGroups,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.DEFAULT_HOUSEHOLD
      );

      // Then
      expect(result1).toEqual([QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.ADULT_2]);

      // When - Second household
      const result2 = getGroupMembers(
        mockHouseholdMultipleGroups,
        QUERY_ENTITY_NAMES.HOUSEHOLDS,
        QUERY_GROUP_KEYS.SECOND_HOUSEHOLD
      );

      // Then
      expect(result2).toEqual([QUERY_PERSON_NAMES.ADULT_3]);
    });
  });

  describe('getGroups', () => {
    test('given entity with groups when getting groups then returns all groups', () => {
      // When
      const result = getGroups(mockHouseholdTwoAdultsTwoChildren, QUERY_ENTITY_NAMES.HOUSEHOLDS);

      // Then
      expect(result).toEqual(expectedGroupsHouseholds);
    });

    test('given non-existent entity when getting groups then returns empty array', () => {
      // When
      const result = getGroups(mockHouseholdTwoAdultsTwoChildren, QUERY_ENTITY_NAMES.NON_EXISTENT);

      // Then
      expect(result).toEqual([]);
    });

    test('given entity with no groups when getting groups then returns empty array', () => {
      // When
      const result = getGroups(mockEmptyHousehold, QUERY_ENTITY_NAMES.FAMILIES);

      // Then
      expect(result).toEqual([]);
    });

    test('given multiple groups when getting groups then returns all groups', () => {
      // When
      const result = getGroups(mockHouseholdMultipleGroups, QUERY_ENTITY_NAMES.HOUSEHOLDS);

      // Then
      expect(result).toEqual(expectedGroupsMultiple);
    });

    test('given UK household when getting benefit units then returns benefit unit groups', () => {
      // When
      const result = getGroups(mockUKHousehold, QUERY_ENTITY_NAMES.BEN_UNITS);

      // Then
      expect(result).toEqual([
        {
          key: QUERY_GROUP_KEYS.DEFAULT_BEN_UNIT,
          members: [QUERY_PERSON_NAMES.ADULT_1, QUERY_PERSON_NAMES.CHILD_1],
        },
      ]);
    });

    test('given tax units when getting groups then returns tax unit groups', () => {
      // When
      const result = getGroups(mockHouseholdTwoAdultsTwoChildren, QUERY_ENTITY_NAMES.TAX_UNITS);

      // Then
      expect(result).toEqual([
        {
          key: QUERY_GROUP_KEYS.DEFAULT_TAX_UNIT,
          members: [
            QUERY_PERSON_NAMES.ADULT_1,
            QUERY_PERSON_NAMES.ADULT_2,
            QUERY_PERSON_NAMES.CHILD_1,
            QUERY_PERSON_NAMES.CHILD_2,
          ],
        },
      ]);
    });
  });
});