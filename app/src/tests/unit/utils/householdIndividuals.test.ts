import { describe, expect, test } from 'vitest';
import {
  MOCK_EMPTY_HOUSEHOLD,
  MOCK_HOUSEHOLD_EMPTY_ENTITIES,
  MOCK_HOUSEHOLD_WITH_ENTITIES,
  MOCK_HOUSEHOLD_WITH_ENTITY_VARS,
  MOCK_HOUSEHOLD_WITH_NAMES,
  MOCK_MANY_DEPENDENTS_PEOPLE,
  MOCK_UK_PARENT_CHILD_PEOPLE,
  MOCK_US_FAMILY_PEOPLE,
} from '@/tests/fixtures/utils/householdIndividualsMocks';
import { HouseholdPerson } from '@/types/ingredients/Household';
import {
  extractGroupEntities,
  getAllPersonDisplayNames,
  getPersonDisplayName,
  getPersonDisplayNameInContext,
  sortPeopleByOrder,
} from '@/utils/householdIndividuals';

describe('householdIndividuals', () => {
  describe('getPersonDisplayName', () => {
    test('given index 0 then returns you', () => {
      expect(getPersonDisplayName({ age: 30 }, 0)).toBe('you');
    });

    test('given non-dependent at index 1 then returns your partner', () => {
      expect(getPersonDisplayName({ age: 30 }, 1)).toBe('your partner');
    });

    test('given dependent by is_tax_unit_dependent then returns dependent name', () => {
      expect(getPersonDisplayName({ age: 12, is_tax_unit_dependent: true }, 2)).toBe(
        'your first dependent'
      );
    });

    test('given dependent by age under 18 then returns dependent name', () => {
      expect(getPersonDisplayName({ age: 10 }, 2)).toBe('your first dependent');
    });
  });

  describe('getPersonDisplayNameInContext', () => {
    test('given index 0 then returns you', () => {
      expect(getPersonDisplayNameInContext(MOCK_US_FAMILY_PEOPLE, 0)).toBe('you');
    });

    test('given adult at index 1 then returns your partner', () => {
      expect(getPersonDisplayNameInContext(MOCK_US_FAMILY_PEOPLE, 1)).toBe('your partner');
    });

    test('given first dependent then returns your first dependent', () => {
      expect(getPersonDisplayNameInContext(MOCK_US_FAMILY_PEOPLE, 2)).toBe('your first dependent');
    });

    test('given second dependent then returns your second dependent', () => {
      expect(getPersonDisplayNameInContext(MOCK_US_FAMILY_PEOPLE, 3)).toBe('your second dependent');
    });

    test('given out of bounds index then returns person N', () => {
      expect(getPersonDisplayNameInContext(MOCK_US_FAMILY_PEOPLE, 10)).toBe('person 11');
    });

    test('given single person then returns you', () => {
      expect(getPersonDisplayNameInContext([{ age: 30 }], 0)).toBe('you');
    });

    test('given UK household with child by age then returns dependent', () => {
      expect(getPersonDisplayNameInContext(MOCK_UK_PARENT_CHILD_PEOPLE, 1)).toBe(
        'your first dependent'
      );
    });

    test('given many dependents then uses ordinals then falls back to Nth', () => {
      expect(getPersonDisplayNameInContext(MOCK_MANY_DEPENDENTS_PEOPLE, 1)).toBe(
        'your first dependent'
      );
      expect(getPersonDisplayNameInContext(MOCK_MANY_DEPENDENTS_PEOPLE, 10)).toBe(
        'your tenth dependent'
      );
      expect(getPersonDisplayNameInContext(MOCK_MANY_DEPENDENTS_PEOPLE, 11)).toBe(
        'your 11th dependent'
      );
    });
  });

  describe('getAllPersonDisplayNames', () => {
    test('given household with adults and children then returns all names', () => {
      const names = getAllPersonDisplayNames(MOCK_HOUSEHOLD_WITH_NAMES);

      expect(names).toEqual(['you', 'your partner', 'your first dependent']);
    });

    test('given empty household then returns empty array', () => {
      expect(getAllPersonDisplayNames(MOCK_EMPTY_HOUSEHOLD)).toEqual([]);
    });
  });

  describe('sortPeopleByOrder', () => {
    test('given people array then returns shallow copy in same order', () => {
      const people: HouseholdPerson[] = [{ age: 30 }, { age: 10 }];
      const sorted = sortPeopleByOrder(people);

      expect(sorted).toEqual(people);
      expect(sorted).not.toBe(people);
    });
  });

  describe('extractGroupEntities', () => {
    test('given US household with people then extracts person entity', () => {
      const entities = extractGroupEntities(MOCK_HOUSEHOLD_WITH_ENTITIES);

      const personEntity = entities.find((e) => e.entityType === 'person');
      expect(personEntity).toBeDefined();
      expect(personEntity!.instances).toHaveLength(1);
      expect(personEntity!.instances[0].name).toBe('you');
    });

    test('given household entity with variables then extracts entity variables', () => {
      const entities = extractGroupEntities(MOCK_HOUSEHOLD_WITH_ENTITY_VARS);

      const householdEntity = entities.find((e) => e.entityType === 'household');
      expect(householdEntity).toBeDefined();
      expect(householdEntity!.instances[0].variables).toHaveLength(2);
    });

    test('given empty entity dict then skips it', () => {
      const entities = extractGroupEntities(MOCK_HOUSEHOLD_EMPTY_ENTITIES);

      const taxEntity = entities.find((e) => e.entityType === 'tax_unit');
      expect(taxEntity).toBeUndefined();
    });

    test('given empty people array then does not add person entity', () => {
      const entities = extractGroupEntities(MOCK_EMPTY_HOUSEHOLD);

      expect(entities.find((e) => e.entityType === 'person')).toBeUndefined();
    });
  });
});
