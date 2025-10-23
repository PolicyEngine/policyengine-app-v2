import { describe, it, expect } from 'vitest';
import { getDisplayStyleConfig } from '@/utils/householdDisplayStyles';
import {
  TEST_DIRECTIONS,
  EXPECTED_COLORS,
  EXPECTED_ARROW_DIRECTIONS,
} from '@/tests/fixtures/utils/householdDisplayStylesMocks';

describe('householdDisplayStyles', () => {
  describe('getDisplayStyleConfig', () => {
    describe('comparison mode', () => {
      it('given increase then uses positive colors and up arrow', () => {
        // When
        const result = getDisplayStyleConfig(true, TEST_DIRECTIONS.INCREASE, false);

        // Then
        expect(result).toEqual({
          arrowColor: EXPECTED_COLORS.POSITIVE,
          arrowDirection: EXPECTED_ARROW_DIRECTIONS.UP,
          valueColor: EXPECTED_COLORS.POSITIVE,
          borderColor: EXPECTED_COLORS.POSITIVE,
        });
      });

      it('given decrease then uses negative colors and down arrow', () => {
        // When
        const result = getDisplayStyleConfig(true, TEST_DIRECTIONS.DECREASE, false);

        // Then
        expect(result).toEqual({
          arrowColor: EXPECTED_COLORS.NEGATIVE,
          arrowDirection: EXPECTED_ARROW_DIRECTIONS.DOWN,
          valueColor: EXPECTED_COLORS.NEGATIVE,
          borderColor: EXPECTED_COLORS.NEGATIVE,
        });
      });

      it('given no-change then uses negative colors and down arrow', () => {
        // When
        const result = getDisplayStyleConfig(true, TEST_DIRECTIONS.NO_CHANGE, false);

        // Then
        expect(result).toEqual({
          arrowColor: EXPECTED_COLORS.NEGATIVE,
          arrowDirection: EXPECTED_ARROW_DIRECTIONS.DOWN,
          valueColor: EXPECTED_COLORS.NEGATIVE,
          borderColor: EXPECTED_COLORS.NEGATIVE,
        });
      });

      it('given isAdd true then ignores it in comparison mode', () => {
        // When
        const result = getDisplayStyleConfig(true, TEST_DIRECTIONS.INCREASE, true);

        // Then - isAdd is ignored, uses direction instead
        expect(result.arrowColor).toBe(EXPECTED_COLORS.POSITIVE);
        expect(result.arrowDirection).toBe(EXPECTED_ARROW_DIRECTIONS.UP);
      });
    });

    describe('single mode', () => {
      it('given isAdd true then uses positive colors and up arrow', () => {
        // When
        const result = getDisplayStyleConfig(false, TEST_DIRECTIONS.NO_CHANGE, true);

        // Then
        expect(result).toEqual({
          arrowColor: EXPECTED_COLORS.POSITIVE,
          arrowDirection: EXPECTED_ARROW_DIRECTIONS.UP,
          valueColor: EXPECTED_COLORS.POSITIVE,
          borderColor: EXPECTED_COLORS.POSITIVE,
        });
      });

      it('given isAdd false then uses negative colors and down arrow', () => {
        // When
        const result = getDisplayStyleConfig(false, TEST_DIRECTIONS.NO_CHANGE, false);

        // Then
        expect(result).toEqual({
          arrowColor: EXPECTED_COLORS.NEGATIVE,
          arrowDirection: EXPECTED_ARROW_DIRECTIONS.DOWN,
          valueColor: EXPECTED_COLORS.NEGATIVE,
          borderColor: EXPECTED_COLORS.NEGATIVE,
        });
      });

      it('given direction in single mode then ignores direction', () => {
        // When
        const result = getDisplayStyleConfig(false, TEST_DIRECTIONS.INCREASE, false);

        // Then - direction is ignored in single mode, uses isAdd
        expect(result.arrowColor).toBe(EXPECTED_COLORS.NEGATIVE);
        expect(result.arrowDirection).toBe(EXPECTED_ARROW_DIRECTIONS.DOWN);
      });
    });
  });
});
