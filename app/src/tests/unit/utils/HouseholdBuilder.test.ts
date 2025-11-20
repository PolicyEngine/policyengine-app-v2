import { beforeEach, describe, expect, test } from 'vitest';
import {
  countGroupMembers,
  countPeople,
  COUNTRIES,
  createEmptyHousehold,
  createMockVariables,
  createYearKeyedValue,
  ENTITY_NAMES,
  ERROR_MESSAGES,
  EXPECTED_COUNTRY_ENTITIES,
  GROUP_KEYS,
  PERSON_AGES,
  PERSON_NAMES,
  VARIABLE_NAMES,
  VARIABLE_VALUES,
  verifyHouseholdStructure,
  verifyPersonExists,
  verifyPersonInGroup,
  verifyPersonNotInAnyGroup,
  verifyVariableValue,
  YEARS,
} from '@/tests/fixtures/utils/householdBuilderMocks';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';

describe('HouseholdBuilder', () => {
  let builder: HouseholdBuilder;

  beforeEach(() => {
    builder = new HouseholdBuilder(COUNTRIES.US, YEARS.CURRENT);
  });

  describe('constructor', () => {
    test('given valid country and year when constructed then creates empty household', () => {
      // When
      const household = builder.build();

      // Then
      verifyHouseholdStructure(household, COUNTRIES.US);
      expect(countPeople(household)).toBe(0);
    });

    test('given US country when constructed then includes US-specific entities', () => {
      // When
      const household = builder.build();

      // Then
      expect(household.householdData.families).toBeDefined();
      expect(household.householdData.taxUnits).toBeDefined();
      expect(household.householdData.spmUnits).toBeDefined();
      expect(household.householdData.maritalUnits).toBeDefined();
      expect(household.householdData.households).toBeDefined();
    });

    test('given UK country when constructed then includes UK-specific entities', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.UK as any, YEARS.CURRENT);

      // When
      const household = builder.build();

      // Then
      expect(household.householdData.benunits).toBeDefined();
      expect(household.householdData.households).toBeDefined();
      expect(household.householdData.families).toBeUndefined();
      expect(household.householdData.taxUnits).toBeUndefined();
    });

    test('given Canada country when constructed then includes basic entities', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.CA as any, YEARS.CURRENT);

      // When
      const household = builder.build();

      // Then
      expect(household.householdData.people).toBeDefined();
      expect(household.householdData.households).toBeDefined();
      expect(household.householdData.families).toBeUndefined();
      expect(household.householdData.benunits).toBeUndefined();
    });

    test('given no year when constructed then uses default year', () => {
      // Given
      const DEFAULT_YEAR = '2025';
      builder = new HouseholdBuilder(COUNTRIES.US, DEFAULT_YEAR);

      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      expect(person.age[DEFAULT_YEAR]).toBe(PERSON_AGES.ADULT_DEFAULT);
    });

    test('given invalid year format when constructed then throws error', () => {
      // When/Then
      expect(() => new HouseholdBuilder(COUNTRIES.US, YEARS.INVALID)).toThrow(
        ERROR_MESSAGES.INVALID_YEAR
      );
    });

    test('given non-numeric year when constructed then throws error', () => {
      // When/Then
      expect(() => new HouseholdBuilder(COUNTRIES.US, YEARS.INVALID_TEXT)).toThrow(
        ERROR_MESSAGES.INVALID_YEAR
      );
    });
  });

  describe('build method', () => {
    test('given household with data when build then returns deep clone', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household1 = builder.build();

      // When
      household1.householdData.people[PERSON_NAMES.ADULT_1].age[YEARS.CURRENT] = 99;
      const household2 = builder.build();

      // Then
      expect(household2.householdData.people[PERSON_NAMES.ADULT_1].age[YEARS.CURRENT]).toBe(
        PERSON_AGES.ADULT_DEFAULT
      );
    });

    test('given multiple builds when called then each returns independent copy', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      const household1 = builder.build();
      const household2 = builder.build();

      // Then
      expect(household1).not.toBe(household2);
      expect(household1).toEqual(household2);
    });
  });

  describe('addAdult method', () => {
    test('given adult data when addAdult then adds person to household', () => {
      // When
      const personKey = builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      expect(personKey).toBe(PERSON_NAMES.ADULT_1);
      verifyPersonExists(household, PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
    });

    test('given adult with variables when addAdult then includes variables', () => {
      // Given
      const variables = createMockVariables(
        VARIABLE_VALUES.INCOME_DEFAULT,
        VARIABLE_VALUES.STATE_CA
      );

      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT, variables);
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      verifyVariableValue(person, VARIABLE_NAMES.EMPLOYMENT_INCOME, VARIABLE_VALUES.INCOME_DEFAULT);
      verifyVariableValue(person, VARIABLE_NAMES.STATE_CODE, VARIABLE_VALUES.STATE_CA);
    });

    test('given US adult when addAdult then adds to tax unit and household', () => {
      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      verifyPersonInGroup(
        household,
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.TAX_UNITS,
        GROUP_KEYS.DEFAULT_TAX_UNIT
      );
      verifyPersonInGroup(
        household,
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD
      );
    });

    test('given UK adult when addAdult then adds to benefit unit and household', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.UK as any, YEARS.CURRENT);

      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      verifyPersonInGroup(
        household,
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.BEN_UNITS,
        GROUP_KEYS.DEFAULT_BEN_UNIT
      );
      verifyPersonInGroup(
        household,
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD
      );
    });

    test('given multiple adults when addAdult then adds all to same default groups', () => {
      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_YOUNG);
      const household = builder.build();

      // Then
      expect(
        countGroupMembers(household, ENTITY_NAMES.TAX_UNITS, GROUP_KEYS.DEFAULT_TAX_UNIT)
      ).toBe(2);
      expect(
        countGroupMembers(household, ENTITY_NAMES.HOUSEHOLDS, GROUP_KEYS.DEFAULT_HOUSEHOLD)
      ).toBe(2);
    });

    test('given year-keyed variables when addAdult then preserves structure', () => {
      // Given
      const variables = {
        [VARIABLE_NAMES.EMPLOYMENT_INCOME]: createYearKeyedValue(
          VARIABLE_VALUES.INCOME_DEFAULT,
          YEARS.PAST
        ),
      };

      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT, variables);
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      expect(person[VARIABLE_NAMES.EMPLOYMENT_INCOME][YEARS.PAST]).toBe(
        VARIABLE_VALUES.INCOME_DEFAULT
      );
    });
  });

  describe('addChild method', () => {
    test('given child data when addChild then adds person to household', () => {
      // When
      const childKey = builder.addChild(PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT, []);
      const household = builder.build();

      // Then
      expect(childKey).toBe(PERSON_NAMES.CHILD_1);
      verifyPersonExists(household, PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT);
    });

    test('given US child when addChild then sets tax unit dependent flag', () => {
      // When
      builder.addChild(PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT, []);
      const household = builder.build();

      // Then
      const child = household.householdData.people[PERSON_NAMES.CHILD_1];
      verifyVariableValue(child, VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT, true);
    });

    test('given UK child when addChild then does not set tax unit dependent flag', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.UK as any, YEARS.CURRENT);

      // When
      builder.addChild(PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT, []);
      const household = builder.build();

      // Then
      const child = household.householdData.people[PERSON_NAMES.CHILD_1];
      expect(child[VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT]).toBeUndefined();
    });

    test('given child with parents when addChild then adds to household groups', () => {
      // Given
      const parent1 = builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const parent2 = builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.addChild(PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT, [parent1, parent2]);
      const household = builder.build();

      // Then
      verifyPersonInGroup(
        household,
        PERSON_NAMES.CHILD_1,
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD
      );
      expect(
        countGroupMembers(household, ENTITY_NAMES.HOUSEHOLDS, GROUP_KEYS.DEFAULT_HOUSEHOLD)
      ).toBe(3);
    });

    test('given child with variables when addChild then includes variables', () => {
      // Given
      const variables = { [VARIABLE_NAMES.CUSTOM_VAR]: VARIABLE_VALUES.STRING_VALUE };

      // When
      builder.addChild(PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT, [], variables);
      const household = builder.build();

      // Then
      const child = household.householdData.people[PERSON_NAMES.CHILD_1];
      verifyVariableValue(child, VARIABLE_NAMES.CUSTOM_VAR, VARIABLE_VALUES.STRING_VALUE);
    });
  });

  describe('addChildren method', () => {
    test('given count of 1 when addChildren then adds single child with base name', () => {
      // When
      const childKeys = builder.addChildren(
        PERSON_NAMES.CHILD_BASE,
        1,
        PERSON_AGES.CHILD_DEFAULT,
        []
      );
      const household = builder.build();

      // Then
      expect(childKeys).toHaveLength(1);
      expect(childKeys[0]).toBe(PERSON_NAMES.CHILD_BASE);
      verifyPersonExists(household, PERSON_NAMES.CHILD_BASE, PERSON_AGES.CHILD_DEFAULT);
    });

    test('given count of 3 when addChildren then adds numbered children', () => {
      // When
      const childKeys = builder.addChildren(
        PERSON_NAMES.CHILD_BASE,
        3,
        PERSON_AGES.CHILD_DEFAULT,
        []
      );
      const household = builder.build();

      // Then
      expect(childKeys).toHaveLength(3);
      expect(childKeys[0]).toBe(`${PERSON_NAMES.CHILD_BASE} 1`);
      expect(childKeys[1]).toBe(`${PERSON_NAMES.CHILD_BASE} 2`);
      expect(childKeys[2]).toBe(`${PERSON_NAMES.CHILD_BASE} 3`);
      expect(countPeople(household)).toBe(3);
    });

    test('given variables when addChildren then applies to all children', () => {
      // Given
      const variables = { [VARIABLE_NAMES.CUSTOM_VAR]: VARIABLE_VALUES.NUMBER_VALUE };

      // When
      builder.addChildren(PERSON_NAMES.CHILD_BASE, 2, PERSON_AGES.CHILD_TEEN, [], variables);
      const household = builder.build();

      // Then
      const child1 = household.householdData.people[`${PERSON_NAMES.CHILD_BASE} 1`];
      const child2 = household.householdData.people[`${PERSON_NAMES.CHILD_BASE} 2`];
      verifyVariableValue(child1, VARIABLE_NAMES.CUSTOM_VAR, VARIABLE_VALUES.NUMBER_VALUE);
      verifyVariableValue(child2, VARIABLE_NAMES.CUSTOM_VAR, VARIABLE_VALUES.NUMBER_VALUE);
    });
  });

  describe('removePerson method', () => {
    test('given person exists when removePerson then removes from household', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.removePerson(PERSON_NAMES.ADULT_1);
      const household = builder.build();

      // Then
      expect(household.householdData.people[PERSON_NAMES.ADULT_1]).toBeUndefined();
      expect(household.householdData.people[PERSON_NAMES.ADULT_2]).toBeDefined();
    });

    test('given person in groups when removePerson then removes from all groups', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.removePerson(PERSON_NAMES.ADULT_1);
      const household = builder.build();

      // Then
      verifyPersonNotInAnyGroup(household, PERSON_NAMES.ADULT_1);
      expect(
        countGroupMembers(household, ENTITY_NAMES.TAX_UNITS, GROUP_KEYS.DEFAULT_TAX_UNIT)
      ).toBe(1);
      expect(
        countGroupMembers(household, ENTITY_NAMES.HOUSEHOLDS, GROUP_KEYS.DEFAULT_HOUSEHOLD)
      ).toBe(1);
    });

    test('given person not exists when removePerson then does nothing', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.removePerson('non-existent');
      const household = builder.build();

      // Then
      expect(countPeople(household)).toBe(1);
    });

    test('given person removed when builder continues then can add new person', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.removePerson(PERSON_NAMES.ADULT_1);

      // When
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      expect(countPeople(household)).toBe(1);
      verifyPersonExists(household, PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);
    });
  });

  describe('setPersonVariable method', () => {
    test('given person exists when setPersonVariable then sets variable', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.setPersonVariable(
        PERSON_NAMES.ADULT_1,
        VARIABLE_NAMES.EMPLOYMENT_INCOME,
        VARIABLE_VALUES.INCOME_HIGH
      );
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      verifyVariableValue(person, VARIABLE_NAMES.EMPLOYMENT_INCOME, VARIABLE_VALUES.INCOME_HIGH);
    });

    test('given person not exists when setPersonVariable then throws error', () => {
      // When/Then
      expect(() =>
        builder.setPersonVariable(
          'non-existent',
          VARIABLE_NAMES.EMPLOYMENT_INCOME,
          VARIABLE_VALUES.INCOME_DEFAULT
        )
      ).toThrow(ERROR_MESSAGES.PERSON_NOT_FOUND('non-existent'));
    });

    test('given year-keyed value when setPersonVariable then preserves structure', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const yearKeyedValue = createYearKeyedValue(VARIABLE_VALUES.INCOME_HIGH, YEARS.FUTURE);

      // When
      builder.setPersonVariable(
        PERSON_NAMES.ADULT_1,
        VARIABLE_NAMES.EMPLOYMENT_INCOME,
        yearKeyedValue
      );
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      expect(person[VARIABLE_NAMES.EMPLOYMENT_INCOME][YEARS.FUTURE]).toBe(
        VARIABLE_VALUES.INCOME_HIGH
      );
    });

    test('given existing variable when setPersonVariable then overwrites', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT, {
        [VARIABLE_NAMES.EMPLOYMENT_INCOME]: VARIABLE_VALUES.INCOME_LOW,
      });

      // When
      builder.setPersonVariable(
        PERSON_NAMES.ADULT_1,
        VARIABLE_NAMES.EMPLOYMENT_INCOME,
        VARIABLE_VALUES.INCOME_HIGH
      );
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      verifyVariableValue(person, VARIABLE_NAMES.EMPLOYMENT_INCOME, VARIABLE_VALUES.INCOME_HIGH);
    });
  });

  describe('setGroupVariable method', () => {
    test('given group exists when setGroupVariable then sets variable', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.setGroupVariable(
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD,
        VARIABLE_NAMES.STATE_CODE,
        VARIABLE_VALUES.STATE_NY
      );
      const household = builder.build();

      // Then
      const group = household.householdData.households![GROUP_KEYS.DEFAULT_HOUSEHOLD];
      verifyVariableValue(group, VARIABLE_NAMES.STATE_CODE, VARIABLE_VALUES.STATE_NY);
    });

    test('given group not exists when setGroupVariable then throws error', () => {
      // When/Then
      expect(() =>
        builder.setGroupVariable(
          ENTITY_NAMES.HOUSEHOLDS,
          'non-existent',
          VARIABLE_NAMES.STATE_CODE,
          VARIABLE_VALUES.STATE_CA
        )
      ).toThrow(ERROR_MESSAGES.GROUP_NOT_FOUND('non-existent', ENTITY_NAMES.HOUSEHOLDS));
    });

    test('given entity not exists when setGroupVariable then throws error', () => {
      // When/Then
      expect(() =>
        builder.setGroupVariable(
          'non-existent-entity',
          GROUP_KEYS.DEFAULT_HOUSEHOLD,
          VARIABLE_NAMES.STATE_CODE,
          VARIABLE_VALUES.STATE_CA
        )
      ).toThrow();
    });

    test('given year-keyed value when setGroupVariable then preserves structure', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const yearKeyedValue = createYearKeyedValue(VARIABLE_VALUES.STATE_NY, YEARS.PAST);

      // When
      builder.setGroupVariable(
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD,
        VARIABLE_NAMES.STATE_CODE,
        yearKeyedValue
      );
      const household = builder.build();

      // Then
      const group = household.householdData.households![GROUP_KEYS.DEFAULT_HOUSEHOLD];
      expect(group[VARIABLE_NAMES.STATE_CODE][YEARS.PAST]).toBe(VARIABLE_VALUES.STATE_NY);
    });
  });

  describe('assignToGroupEntity method', () => {
    test('given existing group when assignToGroupEntity then adds person to group', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.assignToGroupEntity(
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.FAMILIES,
        GROUP_KEYS.DEFAULT_FAMILY
      );
      const household = builder.build();

      // Then
      verifyPersonInGroup(
        household,
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.FAMILIES,
        GROUP_KEYS.DEFAULT_FAMILY
      );
    });

    test('given group not exists when assignToGroupEntity then creates group', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.assignToGroupEntity(
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.FAMILIES,
        GROUP_KEYS.CUSTOM_GROUP
      );
      const household = builder.build();

      // Then
      const families = household.householdData.families!;
      expect(families[GROUP_KEYS.CUSTOM_GROUP]).toBeDefined();
      expect(families[GROUP_KEYS.CUSTOM_GROUP].members).toContain(PERSON_NAMES.ADULT_1);
    });

    test('given person already in group when assignToGroupEntity then does not duplicate', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.assignToGroupEntity(
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD
      );
      builder.assignToGroupEntity(
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.HOUSEHOLDS,
        GROUP_KEYS.DEFAULT_HOUSEHOLD
      );
      const household = builder.build();

      // Then
      const members = household.householdData.households![GROUP_KEYS.DEFAULT_HOUSEHOLD].members;
      expect(members.filter((m: string) => m === PERSON_NAMES.ADULT_1)).toHaveLength(1);
    });

    test('given entity not exists when assignToGroupEntity then creates entity', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      delete builder.getHousehold().householdData.families;

      // When
      builder.assignToGroupEntity(
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.FAMILIES,
        GROUP_KEYS.DEFAULT_FAMILY
      );
      const household = builder.build();

      // Then
      expect(household.householdData.families).toBeDefined();
      verifyPersonInGroup(
        household,
        PERSON_NAMES.ADULT_1,
        ENTITY_NAMES.FAMILIES,
        GROUP_KEYS.DEFAULT_FAMILY
      );
    });
  });

  describe('setMaritalStatus method', () => {
    test('given US household when setMaritalStatus then creates marital unit', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.setMaritalStatus(PERSON_NAMES.ADULT_1, PERSON_NAMES.ADULT_2);
      const household = builder.build();

      // Then
      const maritalUnits = household.householdData.maritalUnits!;
      expect(maritalUnits[GROUP_KEYS.DEFAULT_MARITAL_UNIT]).toBeDefined();
      expect(maritalUnits[GROUP_KEYS.DEFAULT_MARITAL_UNIT].members).toContain(PERSON_NAMES.ADULT_1);
      expect(maritalUnits[GROUP_KEYS.DEFAULT_MARITAL_UNIT].members).toContain(PERSON_NAMES.ADULT_2);
    });

    test('given UK household when setMaritalStatus then does not create marital unit', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.UK as any, YEARS.CURRENT);
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.setMaritalStatus(PERSON_NAMES.ADULT_1, PERSON_NAMES.ADULT_2);
      const household = builder.build();

      // Then
      expect(household.householdData.maritalUnits).toBeUndefined();
    });

    test('given Canada household when setMaritalStatus then does not create marital unit', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.CA as any, YEARS.CURRENT);
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.setMaritalStatus(PERSON_NAMES.ADULT_1, PERSON_NAMES.ADULT_2);
      const household = builder.build();

      // Then
      expect(household.householdData.maritalUnits).toBeUndefined();
    });
  });

  describe('setCurrentYear method', () => {
    test('given valid year when setCurrentYear then updates year for new data', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      builder.setCurrentYear(YEARS.FUTURE);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      const person1 = household.householdData.people[PERSON_NAMES.ADULT_1];
      const person2 = household.householdData.people[PERSON_NAMES.ADULT_2];
      expect(person1.age[YEARS.CURRENT]).toBe(PERSON_AGES.ADULT_DEFAULT);
      expect(person2.age[YEARS.FUTURE]).toBe(PERSON_AGES.ADULT_DEFAULT);
    });

    test('given invalid year when setCurrentYear then throws error', () => {
      // When/Then
      expect(() => builder.setCurrentYear(YEARS.INVALID)).toThrow(ERROR_MESSAGES.YEAR_FORMAT);
    });

    test('given non-numeric year when setCurrentYear then throws error', () => {
      // When/Then
      expect(() => builder.setCurrentYear(YEARS.INVALID_TEXT)).toThrow(ERROR_MESSAGES.YEAR_FORMAT);
    });

    test('given year changed when setting variables then uses new year', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      builder.setCurrentYear(YEARS.PAST);

      // When
      builder.setPersonVariable(
        PERSON_NAMES.ADULT_1,
        VARIABLE_NAMES.EMPLOYMENT_INCOME,
        VARIABLE_VALUES.INCOME_DEFAULT
      );
      const household = builder.build();

      // Then
      const person = household.householdData.people[PERSON_NAMES.ADULT_1];
      expect(person[VARIABLE_NAMES.EMPLOYMENT_INCOME][YEARS.PAST]).toBe(
        VARIABLE_VALUES.INCOME_DEFAULT
      );
      expect(person[VARIABLE_NAMES.EMPLOYMENT_INCOME][YEARS.CURRENT]).toBeUndefined();
    });
  });

  describe('loadHousehold method', () => {
    test('given existing household when loadHousehold then loads for modification', () => {
      // Given
      const existingHousehold = createEmptyHousehold(COUNTRIES.US);
      existingHousehold.householdData.people[PERSON_NAMES.ADULT_1] = {
        age: { [YEARS.CURRENT]: PERSON_AGES.ADULT_DEFAULT },
      };

      // When
      builder.loadHousehold(existingHousehold);
      builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      expect(countPeople(household)).toBe(2);
      verifyPersonExists(household, PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      verifyPersonExists(household, PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);
    });

    test('given loaded household when modified then original unchanged', () => {
      // Given
      const existingHousehold = createEmptyHousehold(COUNTRIES.US);
      existingHousehold.householdData.people[PERSON_NAMES.ADULT_1] = {
        age: { [YEARS.CURRENT]: PERSON_AGES.ADULT_DEFAULT },
      };

      // When
      builder.loadHousehold(existingHousehold);
      builder.removePerson(PERSON_NAMES.ADULT_1);
      builder.build();

      // Then
      expect(existingHousehold.householdData.people[PERSON_NAMES.ADULT_1]).toBeDefined();
    });
  });

  describe('getHousehold method', () => {
    test('given household with data when getHousehold then returns current state', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      const household = builder.getHousehold();

      // Then
      verifyPersonExists(household, PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
    });

    test('given getHousehold when modified then affects builder state', () => {
      // Given
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);

      // When
      const household = builder.getHousehold();
      household.householdData.people[PERSON_NAMES.ADULT_1].age[YEARS.CURRENT] = 99;
      const builtHousehold = builder.build();

      // Then
      expect(builtHousehold.householdData.people[PERSON_NAMES.ADULT_1].age[YEARS.CURRENT]).toBe(99);
    });
  });

  describe('fluent API', () => {
    test('given chained operations when building then all apply correctly', () => {
      // When
      // Note: addAdult and addChild return person IDs, not the builder instance
      const adult1Id = builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const adult2Id = builder.addAdult(PERSON_NAMES.ADULT_2, PERSON_AGES.ADULT_DEFAULT);
      const childId = builder.addChild(PERSON_NAMES.CHILD_1, PERSON_AGES.CHILD_DEFAULT, [
        adult1Id,
        adult2Id,
      ]);

      // These methods support chaining (return 'this')
      const household = builder
        .setMaritalStatus(adult1Id, adult2Id)
        .setPersonVariable(
          adult1Id,
          VARIABLE_NAMES.EMPLOYMENT_INCOME,
          VARIABLE_VALUES.INCOME_DEFAULT
        )
        .setGroupVariable(
          ENTITY_NAMES.HOUSEHOLDS,
          GROUP_KEYS.DEFAULT_HOUSEHOLD,
          VARIABLE_NAMES.STATE_CODE,
          VARIABLE_VALUES.STATE_CA
        )
        .build();

      // Then
      expect(countPeople(household)).toBe(3);
      verifyPersonExists(household, adult1Id);
      verifyPersonExists(household, adult2Id);
      verifyPersonExists(household, childId);

      const person1 = household.householdData.people[adult1Id];
      verifyVariableValue(
        person1,
        VARIABLE_NAMES.EMPLOYMENT_INCOME,
        VARIABLE_VALUES.INCOME_DEFAULT
      );

      const householdGroup = household.householdData.households![GROUP_KEYS.DEFAULT_HOUSEHOLD];
      verifyVariableValue(householdGroup, VARIABLE_NAMES.STATE_CODE, VARIABLE_VALUES.STATE_CA);

      const maritalUnit = household.householdData.maritalUnits![GROUP_KEYS.DEFAULT_MARITAL_UNIT];
      expect(maritalUnit.members).toHaveLength(2);
    });
  });

  describe('country-specific behaviors', () => {
    test('given each supported country when constructed then creates appropriate structure', () => {
      // Test each country
      const countries = [COUNTRIES.US, COUNTRIES.UK, COUNTRIES.CA, COUNTRIES.NG, COUNTRIES.IL];

      countries.forEach((country) => {
        // Given/When
        const countryBuilder = new HouseholdBuilder(country as any, YEARS.CURRENT);
        const household = countryBuilder.build();

        // Then
        verifyHouseholdStructure(household, country);

        const expectedEntities =
          EXPECTED_COUNTRY_ENTITIES[country as keyof typeof EXPECTED_COUNTRY_ENTITIES];
        if (expectedEntities) {
          expectedEntities.forEach((entity) => {
            if (entity !== 'people') {
              expect(household.householdData[entity]).toBeDefined();
            }
          });
        }
      });
    });

    test('given Nigeria household when adding people then uses basic structure', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.NG as any, YEARS.CURRENT);

      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      expect(household.householdData.people).toBeDefined();
      expect(household.householdData.households).toBeDefined();
      expect(household.householdData.families).toBeUndefined();
      expect(household.householdData.taxUnits).toBeUndefined();
      expect(household.householdData.benunits).toBeUndefined();
    });

    test('given Israel household when adding people then uses basic structure', () => {
      // Given
      builder = new HouseholdBuilder(COUNTRIES.IL as any, YEARS.CURRENT);

      // When
      builder.addAdult(PERSON_NAMES.ADULT_1, PERSON_AGES.ADULT_DEFAULT);
      const household = builder.build();

      // Then
      expect(household.householdData.people).toBeDefined();
      expect(household.householdData.households).toBeDefined();
      expect(household.householdData.families).toBeUndefined();
      expect(household.householdData.taxUnits).toBeUndefined();
      expect(household.householdData.benunits).toBeUndefined();
    });
  });
});
