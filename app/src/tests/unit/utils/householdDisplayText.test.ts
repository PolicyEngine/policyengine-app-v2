import { describe, expect, it } from 'vitest';
import {
  mockComparisonDecrease,
  mockComparisonIncrease,
  mockComparisonNoChange,
  mockComparisonSingleMode,
  TEST_FORMATTED_VALUES,
  TEST_VARIABLE_LABELS,
} from '@/tests/fixtures/utils/householdDisplayTextMocks';
import { getTitleText, getVariableDisplayText } from '@/utils/householdDisplayText';

describe('householdDisplayText', () => {
  describe('getVariableDisplayText', () => {
    describe('single mode', () => {
      it('given singular label then uses is', () => {
        // Given
        const comparison = mockComparisonSingleMode();

        // When
        const result = getVariableDisplayText(TEST_VARIABLE_LABELS.NET_INCOME, comparison, false);

        // Then
        expect(result).toBe('Your net income is');
      });

      it('given plural label then uses are', () => {
        // Given
        const comparison = mockComparisonSingleMode();

        // When
        const result = getVariableDisplayText(TEST_VARIABLE_LABELS.BENEFITS, comparison, false);

        // Then
        expect(result).toBe('Your benefits are');
      });
    });

    describe('comparison mode', () => {
      it('given increase then uses increased by', () => {
        // Given
        const comparison = mockComparisonIncrease();

        // When
        const result = getVariableDisplayText(TEST_VARIABLE_LABELS.NET_INCOME, comparison, true);

        // Then
        expect(result).toBe('Your net income increased by');
      });

      it('given decrease then uses decreased by', () => {
        // Given
        const comparison = mockComparisonDecrease();

        // When
        const result = getVariableDisplayText(TEST_VARIABLE_LABELS.NET_INCOME, comparison, true);

        // Then
        expect(result).toBe('Your net income decreased by');
      });

      it('given no-change then uses stayed the same', () => {
        // Given
        const comparison = mockComparisonNoChange();

        // When
        const result = getVariableDisplayText(TEST_VARIABLE_LABELS.NET_INCOME, comparison, true);

        // Then
        expect(result).toBe('Your net income stayed the same at');
      });
    });
  });

  describe('getTitleText', () => {
    describe('single mode', () => {
      it('given value then formats as is statement', () => {
        // Given
        const comparison = mockComparisonSingleMode();

        // When
        const result = getTitleText(
          TEST_VARIABLE_LABELS.NET_INCOME,
          comparison,
          false,
          TEST_FORMATTED_VALUES.CURRENCY
        );

        // Then
        expect(result).toBe('Your net income is $5,000');
      });
    });

    describe('comparison mode', () => {
      it('given increase then formats with increased by', () => {
        // Given
        const comparison = mockComparisonIncrease();

        // When
        const result = getTitleText(
          TEST_VARIABLE_LABELS.NET_INCOME,
          comparison,
          true,
          TEST_FORMATTED_VALUES.CURRENCY
        );

        // Then
        expect(result).toBe('Your net income increased by $5,000');
      });

      it('given decrease then formats with decreased by', () => {
        // Given
        const comparison = mockComparisonDecrease();

        // When
        const result = getTitleText(
          TEST_VARIABLE_LABELS.NET_INCOME,
          comparison,
          true,
          TEST_FORMATTED_VALUES.CURRENCY
        );

        // Then
        expect(result).toBe('Your net income decreased by $5,000');
      });

      it('given no-change then formats as stayed the same', () => {
        // Given
        const comparison = mockComparisonNoChange();

        // When
        const result = getTitleText(
          TEST_VARIABLE_LABELS.NET_INCOME,
          comparison,
          true,
          TEST_FORMATTED_VALUES.ZERO
        );

        // Then
        expect(result).toBe('Your net income stayed the same');
      });
    });
  });
});
