/**
 * Tests for policyParameterUpdate utility
 *
 * Issue #602: Boolean policy parameters not being saved to API
 * The root cause is shallow copying that doesn't properly create new objects
 * for nested arrays, causing React state updates to not trigger.
 */

import { describe, expect, test } from 'vitest';
import { PolicyStateProps } from '@/types/pathwayState';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { addParameterToPolicy } from '@/utils/policyParameterUpdate';

// Test fixtures
const BOOLEAN_PARAM_NAME = 'gov.irs.deductions.itemized.charity.floor.applies';
const NUMERIC_PARAM_NAME = 'gov.irs.income.exemption.amount';

const createEmptyPolicy = (): PolicyStateProps => ({
  id: undefined,
  label: 'Test Policy',
  parameters: [],
});

const createPolicyWithParam = (): PolicyStateProps => ({
  id: '123',
  label: 'Test Policy',
  parameters: [
    {
      name: 'existing.param',
      values: [{ startDate: '2020-01-01', endDate: '2099-12-31', value: 100 }],
    },
  ],
});

const createBooleanInterval = (value: boolean): ValueInterval => ({
  startDate: '2025-01-01',
  endDate: '2099-12-31',
  value,
});

const createNumericInterval = (value: number): ValueInterval => ({
  startDate: '2025-01-01',
  endDate: '2099-12-31',
  value,
});

describe('addParameterToPolicy', () => {
  describe('Issue #602: Boolean parameter changes not saved', () => {
    test('given empty policy when adding boolean param then returns new policy with parameter', () => {
      // Given
      const originalPolicy = createEmptyPolicy();
      const interval = createBooleanInterval(false);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, [interval]);

      // Then
      expect(updatedPolicy.parameters).toHaveLength(1);
      expect(updatedPolicy.parameters[0].name).toBe(BOOLEAN_PARAM_NAME);
      expect(updatedPolicy.parameters[0].values).toHaveLength(1);
      expect(updatedPolicy.parameters[0].values[0].value).toBe(false);
    });

    test('given empty policy when adding boolean param then parameters array is new reference', () => {
      // Given
      const originalPolicy = createEmptyPolicy();
      const interval = createBooleanInterval(true);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, [interval]);

      // Then - CRITICAL: This is the bug fix - new array reference
      expect(updatedPolicy.parameters).not.toBe(originalPolicy.parameters);
    });

    test('given empty policy when adding param then original policy is not mutated', () => {
      // Given
      const originalPolicy = createEmptyPolicy();
      const originalLength = originalPolicy.parameters.length;
      const interval = createBooleanInterval(false);

      // When
      addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, [interval]);

      // Then - Original should be untouched
      expect(originalPolicy.parameters).toHaveLength(originalLength);
    });
  });

  describe('Immutability with existing parameters', () => {
    test('given policy with existing param when adding new param then does not mutate original', () => {
      // Given
      const originalPolicy = createPolicyWithParam();
      const originalParams = [...originalPolicy.parameters];
      const originalFirstParam = { ...originalPolicy.parameters[0] };
      const interval = createNumericInterval(5000);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, NUMERIC_PARAM_NAME, [interval]);

      // Then - Original policy should be unchanged
      expect(originalPolicy.parameters).toHaveLength(originalParams.length);
      expect(originalPolicy.parameters[0].name).toBe(originalFirstParam.name);
      expect(originalPolicy.parameters[0].values).toEqual(originalFirstParam.values);

      // And updated policy should have both params
      expect(updatedPolicy.parameters).toHaveLength(2);
    });

    test('given policy with existing param when adding new param then returns new parameters array', () => {
      // Given
      const originalPolicy = createPolicyWithParam();
      const interval = createNumericInterval(5000);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, NUMERIC_PARAM_NAME, [interval]);

      // Then
      expect(updatedPolicy.parameters).not.toBe(originalPolicy.parameters);
    });

    test('given policy when updating existing param then creates new param object', () => {
      // Given
      const originalPolicy: PolicyStateProps = {
        id: '123',
        label: 'Test',
        parameters: [
          {
            name: BOOLEAN_PARAM_NAME,
            values: [{ startDate: '2020-01-01', endDate: '2024-12-31', value: true }],
          },
        ],
      };
      const originalParam = originalPolicy.parameters[0];
      const newInterval = createBooleanInterval(false);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, [newInterval]);

      // Then - The parameter object should be a new reference
      expect(updatedPolicy.parameters[0]).not.toBe(originalParam);
      expect(updatedPolicy.parameters[0].values).not.toBe(originalParam.values);
    });
  });

  describe('Value handling', () => {
    test('given boolean false value when adding param then preserves false value', () => {
      // Given
      const originalPolicy = createEmptyPolicy();
      const interval = createBooleanInterval(false);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, [interval]);

      // Then - Boolean false should be preserved, not treated as empty/falsy
      expect(updatedPolicy.parameters[0].values[0].value).toBe(false);
      expect(updatedPolicy.parameters[0].values[0].value).not.toBe(undefined);
      expect(updatedPolicy.parameters[0].values[0].value).not.toBe(null);
    });

    test('given numeric zero value when adding param then preserves zero value', () => {
      // Given
      const originalPolicy = createEmptyPolicy();
      const interval = createNumericInterval(0);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, NUMERIC_PARAM_NAME, [interval]);

      // Then - Numeric zero should be preserved
      expect(updatedPolicy.parameters[0].values[0].value).toBe(0);
    });

    test('given multiple intervals when adding param then all intervals are added', () => {
      // Given
      const originalPolicy = createEmptyPolicy();
      const intervals: ValueInterval[] = [
        { startDate: '2025-01-01', endDate: '2025-12-31', value: false },
        { startDate: '2026-01-01', endDate: '2099-12-31', value: true },
      ];

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, intervals);

      // Then
      expect(updatedPolicy.parameters[0].values.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge cases', () => {
    test('given empty intervals array when adding param then parameter still added', () => {
      // Given
      const originalPolicy = createEmptyPolicy();

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, []);

      // Then - Parameter is added but with empty values
      expect(updatedPolicy.parameters).toHaveLength(1);
      expect(updatedPolicy.parameters[0].name).toBe(BOOLEAN_PARAM_NAME);
    });

    test('given null parameters in policy when adding param then handles gracefully', () => {
      // Given
      const originalPolicy: PolicyStateProps = {
        id: undefined,
        label: 'Test',
        parameters: undefined as any, // Simulating edge case
      };
      const interval = createBooleanInterval(false);

      // When
      const updatedPolicy = addParameterToPolicy(originalPolicy, BOOLEAN_PARAM_NAME, [interval]);

      // Then
      expect(updatedPolicy.parameters).toBeDefined();
      expect(updatedPolicy.parameters).toHaveLength(1);
    });
  });
});
