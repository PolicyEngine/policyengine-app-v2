import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockHousehold,
  mockMetadata,
  TEST_VALUES,
  TEST_VARIABLE_NAMES,
} from '@/tests/fixtures/utils/householdComparisonMocks';
import { calculateVariableComparison } from '@/utils/householdComparison';
import { getValueFromHousehold } from '@/utils/householdValues';

// Mock the householdValues module
vi.mock('@/utils/householdValues', () => ({
  getValueFromHousehold: vi.fn(),
}));

describe('householdComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateVariableComparison', () => {
    describe('single mode (no reform)', () => {
      it('given baseline only then returns baseline value with no-change', () => {
        // Given
        const baseline = mockHousehold();
        const metadata = mockMetadata();
        (getValueFromHousehold as any).mockReturnValue(TEST_VALUES.BASELINE_INCOME);

        // When
        const result = calculateVariableComparison(
          TEST_VARIABLE_NAMES.NET_INCOME,
          baseline,
          null,
          metadata
        );

        // Then
        expect(result).toEqual({
          displayValue: TEST_VALUES.BASELINE_INCOME,
          direction: 'no-change',
          baselineValue: TEST_VALUES.BASELINE_INCOME,
        });
      });

      it('given non-numeric value then uses 0', () => {
        // Given
        const baseline = mockHousehold();
        const metadata = mockMetadata();
        (getValueFromHousehold as any).mockReturnValue('invalid');

        // When
        const result = calculateVariableComparison(
          TEST_VARIABLE_NAMES.NET_INCOME,
          baseline,
          null,
          metadata
        );

        // Then
        expect(result.displayValue).toBe(0);
        expect(result.baselineValue).toBe(0);
      });
    });

    describe('comparison mode (with reform)', () => {
      it('given increase then returns increase direction', () => {
        // Given
        const baseline = mockHousehold();
        const reform = mockHousehold();
        const metadata = mockMetadata();
        (getValueFromHousehold as any)
          .mockReturnValueOnce(TEST_VALUES.BASELINE_INCOME)
          .mockReturnValueOnce(TEST_VALUES.REFORM_INCOME_INCREASE);

        // When
        const result = calculateVariableComparison(
          TEST_VARIABLE_NAMES.NET_INCOME,
          baseline,
          reform,
          metadata
        );

        // Then
        expect(result).toEqual({
          displayValue: 5000,
          direction: 'increase',
          baselineValue: TEST_VALUES.BASELINE_INCOME,
          reformValue: TEST_VALUES.REFORM_INCOME_INCREASE,
        });
      });

      it('given decrease then returns decrease direction', () => {
        // Given
        const baseline = mockHousehold();
        const reform = mockHousehold();
        const metadata = mockMetadata();
        (getValueFromHousehold as any)
          .mockReturnValueOnce(TEST_VALUES.BASELINE_INCOME)
          .mockReturnValueOnce(TEST_VALUES.REFORM_INCOME_DECREASE);

        // When
        const result = calculateVariableComparison(
          TEST_VARIABLE_NAMES.NET_INCOME,
          baseline,
          reform,
          metadata
        );

        // Then
        expect(result).toEqual({
          displayValue: 5000,
          direction: 'decrease',
          baselineValue: TEST_VALUES.BASELINE_INCOME,
          reformValue: TEST_VALUES.REFORM_INCOME_DECREASE,
        });
      });

      it('given same values then returns no-change', () => {
        // Given
        const baseline = mockHousehold();
        const reform = mockHousehold();
        const metadata = mockMetadata();
        (getValueFromHousehold as any)
          .mockReturnValueOnce(TEST_VALUES.BASELINE_INCOME)
          .mockReturnValueOnce(TEST_VALUES.REFORM_INCOME_SAME);

        // When
        const result = calculateVariableComparison(
          TEST_VARIABLE_NAMES.NET_INCOME,
          baseline,
          reform,
          metadata
        );

        // Then
        expect(result).toEqual({
          displayValue: 0,
          direction: 'no-change',
          baselineValue: TEST_VALUES.BASELINE_INCOME,
          reformValue: TEST_VALUES.REFORM_INCOME_SAME,
        });
      });

      it('given non-numeric values then uses 0', () => {
        // Given
        const baseline = mockHousehold();
        const reform = mockHousehold();
        const metadata = mockMetadata();
        (getValueFromHousehold as any)
          .mockReturnValueOnce('invalid')
          .mockReturnValueOnce('invalid');

        // When
        const result = calculateVariableComparison(
          TEST_VARIABLE_NAMES.NET_INCOME,
          baseline,
          reform,
          metadata
        );

        // Then
        expect(result.displayValue).toBe(0);
        expect(result.direction).toBe('no-change');
      });
    });
  });
});
