import { describe, expect, test } from 'vitest';
import {
  resolveEntity,
  getVariableEntityDisplayInfo,
  getVariableInfo,
  getValue,
  setValue,
  addVariable,
  addVariableToEntity,
  removeVariable,
  getInputVariables,
  getGroupName,
} from '@/utils/VariableResolver';
import { Household } from '@/types/ingredients/Household';
import {
  MOCK_RESOLVER_METADATA,
  MOCK_METADATA_MISSING_ENTITY,
  MOCK_RESOLVER_HOUSEHOLD,
} from '@/tests/fixtures/utils/variableResolverMocks';

describe('VariableResolver', () => {
  describe('resolveEntity', () => {
    test('given person variable then returns person entity info', () => {
      const result = resolveEntity('age', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({
        entity: 'person',
        plural: 'people',
        label: 'Person',
        isPerson: true,
      });
    });

    test('given household variable then returns household entity info', () => {
      const result = resolveEntity('state_name', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({
        entity: 'household',
        plural: 'households',
        label: 'Household',
        isPerson: false,
      });
    });

    test('given unknown variable then returns null', () => {
      expect(resolveEntity('nonexistent', MOCK_RESOLVER_METADATA)).toBeNull();
    });

    test('given variable with missing entity definition then returns null', () => {
      expect(resolveEntity('foo', MOCK_METADATA_MISSING_ENTITY)).toBeNull();
    });

    test('given empty metadata then returns null', () => {
      expect(resolveEntity('age', {})).toBeNull();
    });
  });

  describe('getVariableEntityDisplayInfo', () => {
    test('given person variable then returns isPerson true with person label', () => {
      const result = getVariableEntityDisplayInfo('age', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({ isPerson: true, label: 'person' });
    });

    test('given household variable then returns isPerson false with entity label', () => {
      const result = getVariableEntityDisplayInfo('state_name', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({ isPerson: false, label: 'household' });
    });

    test('given tax_unit variable then returns lowercase label', () => {
      const result = getVariableEntityDisplayInfo('is_tax_unit_head', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({ isPerson: false, label: 'tax unit' });
    });

    test('given unknown variable then returns default isPerson true', () => {
      const result = getVariableEntityDisplayInfo('nonexistent', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({ isPerson: true, label: 'unknown' });
    });
  });

  describe('getVariableInfo', () => {
    test('given known variable then returns full variable info', () => {
      const result = getVariableInfo('state_name', MOCK_RESOLVER_METADATA);

      expect(result).toEqual({
        name: 'state_name',
        label: 'State',
        entity: 'household',
        dataType: 'Enum',
        defaultValue: 'CA',
        possibleValues: ['CA', 'NY', 'TX'],
        description: undefined,
      });
    });

    test('given variable with description then includes it', () => {
      const result = getVariableInfo('age', MOCK_RESOLVER_METADATA);

      expect(result?.description).toBe('Age of the person');
    });

    test('given unknown variable then returns null', () => {
      expect(getVariableInfo('nonexistent', MOCK_RESOLVER_METADATA)).toBeNull();
    });
  });

  describe('getValue', () => {
    test('given person variable at default index then reads from first person', () => {
      expect(getValue(MOCK_RESOLVER_HOUSEHOLD, 'age', MOCK_RESOLVER_METADATA)).toBe(30);
    });

    test('given person variable at explicit index then reads from that person', () => {
      expect(getValue(MOCK_RESOLVER_HOUSEHOLD, 'employment_income', MOCK_RESOLVER_METADATA, 1)).toBe(30000);
    });

    test('given household variable then reads from entity dict', () => {
      expect(getValue(MOCK_RESOLVER_HOUSEHOLD, 'state_name', MOCK_RESOLVER_METADATA)).toBe('CA');
    });

    test('given tax_unit variable then reads from tax_unit dict', () => {
      expect(getValue(MOCK_RESOLVER_HOUSEHOLD, 'is_tax_unit_head', MOCK_RESOLVER_METADATA)).toBe(true);
    });

    test('given unknown variable then returns null', () => {
      expect(getValue(MOCK_RESOLVER_HOUSEHOLD, 'nonexistent', MOCK_RESOLVER_METADATA)).toBeNull();
    });

    test('given person index out of bounds then returns null', () => {
      expect(getValue(MOCK_RESOLVER_HOUSEHOLD, 'age', MOCK_RESOLVER_METADATA, 99)).toBeNull();
    });

    test('given variable not set on person then returns null', () => {
      const household: Household = {
        ...MOCK_RESOLVER_HOUSEHOLD,
        people: [{ age: 30 }],
      };

      expect(getValue(household, 'employment_income', MOCK_RESOLVER_METADATA)).toBeNull();
    });
  });

  describe('setValue', () => {
    test('given person variable then sets value on correct person', () => {
      const result = setValue(MOCK_RESOLVER_HOUSEHOLD, 'age', 35, MOCK_RESOLVER_METADATA, 0);

      expect(result.people[0].age).toBe(35);
      expect(result.people[1].age).toBe(25);
    });

    test('given household variable then sets value on entity dict', () => {
      const result = setValue(MOCK_RESOLVER_HOUSEHOLD, 'state_name', 'NY', MOCK_RESOLVER_METADATA);

      expect(result.household?.state_name).toBe('NY');
    });

    test('given setValue then returns new object (immutable)', () => {
      const result = setValue(MOCK_RESOLVER_HOUSEHOLD, 'age', 35, MOCK_RESOLVER_METADATA);

      expect(result).not.toBe(MOCK_RESOLVER_HOUSEHOLD);
      expect(MOCK_RESOLVER_HOUSEHOLD.people[0].age).toBe(30);
    });

    test('given unknown variable then returns household unchanged', () => {
      const result = setValue(MOCK_RESOLVER_HOUSEHOLD, 'nonexistent', 42, MOCK_RESOLVER_METADATA);

      expect(result.people).toEqual(MOCK_RESOLVER_HOUSEHOLD.people);
    });

    test('given person index out of bounds then does not modify', () => {
      const result = setValue(MOCK_RESOLVER_HOUSEHOLD, 'age', 99, MOCK_RESOLVER_METADATA, 10);

      expect(result.people[0].age).toBe(30);
      expect(result.people[1].age).toBe(25);
    });
  });

  describe('addVariable', () => {
    test('given person variable then adds default to all people', () => {
      const household: Household = {
        ...MOCK_RESOLVER_HOUSEHOLD,
        people: [{ age: 30 }, { age: 25 }],
      };

      const result = addVariable(household, 'employment_income', MOCK_RESOLVER_METADATA);

      expect(result.people[0].employment_income).toBe(0);
      expect(result.people[1].employment_income).toBe(0);
    });

    test('given person variable already set then does not overwrite', () => {
      const result = addVariable(MOCK_RESOLVER_HOUSEHOLD, 'employment_income', MOCK_RESOLVER_METADATA);

      expect(result.people[0].employment_income).toBe(50000);
    });

    test('given household variable then adds default to entity dict', () => {
      const household: Household = {
        ...MOCK_RESOLVER_HOUSEHOLD,
        household: {},
      };

      const result = addVariable(household, 'state_name', MOCK_RESOLVER_METADATA);

      expect((result.household as Record<string, any>)?.state_name).toBe('CA');
    });

    test('given unknown variable then returns household unchanged', () => {
      const result = addVariable(MOCK_RESOLVER_HOUSEHOLD, 'nonexistent', MOCK_RESOLVER_METADATA);

      expect(result.people).toEqual(MOCK_RESOLVER_HOUSEHOLD.people);
    });
  });

  describe('addVariableToEntity', () => {
    test('given person variable at index then adds default to that person only', () => {
      const household: Household = {
        ...MOCK_RESOLVER_HOUSEHOLD,
        people: [{ age: 30 }, { age: 25 }],
      };

      const result = addVariableToEntity(household, 'employment_income', MOCK_RESOLVER_METADATA, 1);

      expect(result.people[0].employment_income).toBeUndefined();
      expect(result.people[1].employment_income).toBe(0);
    });

    test('given person variable already set then does not overwrite', () => {
      const result = addVariableToEntity(MOCK_RESOLVER_HOUSEHOLD, 'employment_income', MOCK_RESOLVER_METADATA, 0);

      expect(result.people[0].employment_income).toBe(50000);
    });

    test('given group entity variable then adds default to entity dict', () => {
      const household: Household = {
        ...MOCK_RESOLVER_HOUSEHOLD,
        tax_unit: {},
      };

      const result = addVariableToEntity(household, 'is_tax_unit_head', MOCK_RESOLVER_METADATA);

      expect((result.tax_unit as Record<string, any>)?.is_tax_unit_head).toBe(false);
    });
  });

  describe('removeVariable', () => {
    test('given person variable then removes from all people', () => {
      const result = removeVariable(MOCK_RESOLVER_HOUSEHOLD, 'employment_income', MOCK_RESOLVER_METADATA);

      expect(result.people[0]).not.toHaveProperty('employment_income');
      expect(result.people[1]).not.toHaveProperty('employment_income');
      expect(result.people[0].age).toBe(30);
    });

    test('given household variable then removes from entity dict', () => {
      const result = removeVariable(MOCK_RESOLVER_HOUSEHOLD, 'state_name', MOCK_RESOLVER_METADATA);

      expect(result.household).not.toHaveProperty('state_name');
    });

    test('given removeVariable then returns new object (immutable)', () => {
      const result = removeVariable(MOCK_RESOLVER_HOUSEHOLD, 'employment_income', MOCK_RESOLVER_METADATA);

      expect(result).not.toBe(MOCK_RESOLVER_HOUSEHOLD);
      expect(MOCK_RESOLVER_HOUSEHOLD.people[0].employment_income).toBe(50000);
    });

    test('given unknown variable then returns household unchanged', () => {
      const result = removeVariable(MOCK_RESOLVER_HOUSEHOLD, 'nonexistent', MOCK_RESOLVER_METADATA);

      expect(result.people).toEqual(MOCK_RESOLVER_HOUSEHOLD.people);
    });
  });

  describe('getInputVariables', () => {
    test('given metadata with variables then returns all variable infos', () => {
      const result = getInputVariables(MOCK_RESOLVER_METADATA);

      expect(result).toHaveLength(4);
      expect(result.map((v) => v.name)).toContain('age');
      expect(result.map((v) => v.name)).toContain('state_name');
    });

    test('given empty metadata then returns empty array', () => {
      expect(getInputVariables({})).toEqual([]);
    });
  });

  describe('getGroupName', () => {
    test('given people then returns you', () => {
      expect(getGroupName('people')).toBe('you');
    });

    test('given households then returns your household', () => {
      expect(getGroupName('households')).toBe('your household');
    });

    test('given tax_units then returns your tax unit', () => {
      expect(getGroupName('tax_units')).toBe('your tax unit');
    });

    test('given benunits then returns your benefit unit', () => {
      expect(getGroupName('benunits')).toBe('your benefit unit');
    });

    test('given unknown plural then returns it as-is', () => {
      expect(getGroupName('unknown_entities')).toBe('unknown_entities');
    });
  });
});
