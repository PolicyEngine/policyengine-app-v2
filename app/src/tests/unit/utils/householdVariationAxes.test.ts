import { describe, expect, test } from 'vitest';
import {
  buildHouseholdVariationAxes,
  buildMultiDimensionalAxes,
  buildVariationAxesForVariable,
} from '@/utils/householdVariationAxes';
import {
  MOCK_BASE_HOUSEHOLD,
  MOCK_HIGH_INCOME_HOUSEHOLD,
  MOCK_NO_INCOME_HOUSEHOLD,
  MOCK_TWO_PERSON_HOUSEHOLD,
  MOCK_EMPTY_PEOPLE_HOUSEHOLD,
  MOCK_SELF_EMPLOYMENT_HOUSEHOLD,
  MOCK_MULTI_INCOME_HOUSEHOLD,
} from '@/tests/fixtures/utils/householdVariationAxesMocks';

describe('householdVariationAxes', () => {
  describe('buildHouseholdVariationAxes', () => {
    test('given household then removes employment_income from target person', () => {
      const result = buildHouseholdVariationAxes(MOCK_BASE_HOUSEHOLD);

      expect(result.people[0]).not.toHaveProperty('employment_income');
      expect(result.people[0].age).toBe(30);
    });

    test('given household then adds axes with correct range', () => {
      const result = buildHouseholdVariationAxes(MOCK_BASE_HOUSEHOLD);

      expect(result.axes).toHaveLength(1);
      expect(result.axes[0]).toHaveLength(1);
      expect(result.axes[0][0].name).toBe('employment_income');
      expect(result.axes[0][0].min).toBe(0);
      expect(result.axes[0][0].max).toBe(200000);
      expect(result.axes[0][0].count).toBe(401);
    });

    test('given high income then max is 2x earnings', () => {
      const result = buildHouseholdVariationAxes(MOCK_HIGH_INCOME_HOUSEHOLD);

      expect(result.axes[0][0].max).toBe(600000);
    });

    test('given no employment income then max is 200000', () => {
      const result = buildHouseholdVariationAxes(MOCK_NO_INCOME_HOUSEHOLD);

      expect(result.axes[0][0].max).toBe(200000);
    });

    test('given custom person index then modifies correct person', () => {
      const result = buildHouseholdVariationAxes(MOCK_TWO_PERSON_HOUSEHOLD, 1);

      expect(result.people[0].employment_income).toBe(80000);
      expect(result.people[1]).not.toHaveProperty('employment_income');
    });

    test('given empty people array then throws', () => {
      expect(() => buildHouseholdVariationAxes(MOCK_EMPTY_PEOPLE_HOUSEHOLD)).toThrow(
        'Household has no people defined'
      );
    });

    test('given invalid person index then throws', () => {
      expect(() => buildHouseholdVariationAxes(MOCK_BASE_HOUSEHOLD, 5)).toThrow(
        'Person at index 5 not found'
      );
    });

    test('given household then preserves other fields', () => {
      const result = buildHouseholdVariationAxes(MOCK_BASE_HOUSEHOLD);

      expect(result.tax_benefit_model_name).toBe('policyengine_us');
      expect(result.year).toBe(2024);
      expect(result.household).toEqual({ state_name: 'CA' });
    });
  });

  describe('buildVariationAxesForVariable', () => {
    test('given variable name then removes it from person and adds axes', () => {
      const result = buildVariationAxesForVariable(
        MOCK_SELF_EMPLOYMENT_HOUSEHOLD,
        'self_employment_income',
        0,
        0,
        100000
      );

      expect(result.people[0]).not.toHaveProperty('self_employment_income');
      expect(result.people[0].age).toBe(30);
      expect(result.axes[0][0].name).toBe('self_employment_income');
      expect(result.axes[0][0].min).toBe(0);
      expect(result.axes[0][0].max).toBe(100000);
    });

    test('given invalid person index then throws', () => {
      expect(() =>
        buildVariationAxesForVariable(MOCK_BASE_HOUSEHOLD, 'age', 5, 0, 100)
      ).toThrow('Person at index 5 not found');
    });
  });

  describe('buildMultiDimensionalAxes', () => {
    test('given multiple axes then removes all specified variables', () => {
      const result = buildMultiDimensionalAxes(MOCK_MULTI_INCOME_HOUSEHOLD, [
        { variableName: 'employment_income', personIndex: 0, min: 0, max: 200000 },
        { variableName: 'self_employment_income', personIndex: 0, min: 0, max: 50000 },
      ]);

      expect(result.people[0]).not.toHaveProperty('employment_income');
      expect(result.people[0]).not.toHaveProperty('self_employment_income');
      expect(result.people[0].age).toBe(30);
      expect(result.axes).toHaveLength(2);
      expect(result.axes[0][0].name).toBe('employment_income');
      expect(result.axes[1][0].name).toBe('self_employment_income');
    });
  });
});
