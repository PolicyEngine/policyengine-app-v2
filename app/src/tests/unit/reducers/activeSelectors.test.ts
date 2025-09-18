import { describe, expect, test } from 'vitest';
import {
  selectActiveSimulation,
  selectActivePolicy,
  selectActivePopulation,
  selectCurrentPosition,
} from '@/reducers/activeSelectors';
import {
  mockSimulation1,
  mockSimulation2,
  mockPolicy1,
  mockPolicy2,
  mockPopulation1,
  mockPopulation2,
  STANDALONE_MODE_STATE,
  REPORT_MODE_POSITION_0_STATE,
  REPORT_MODE_POSITION_1_STATE,
  STATE_WITH_NULL_AT_POSITION,
  STATE_WITH_ALL_NULL,
} from '@/tests/fixtures/reducers/activeSelectorsMocks';

describe('activeSelectors', () => {
  describe('selectActiveSimulation', () => {
    test('given standalone mode then returns simulation at position 0', () => {
      // Given
      const state = STANDALONE_MODE_STATE;

      // When
      const result = selectActiveSimulation(state);

      // Then
      expect(result).toEqual(mockSimulation1);
    });

    test('given report mode with position 0 then returns simulation at position 0', () => {
      // Given
      const state = REPORT_MODE_POSITION_0_STATE;

      // When
      const result = selectActiveSimulation(state);

      // Then
      expect(result).toEqual(mockSimulation1);
    });

    test('given report mode with position 1 then returns simulation at position 1', () => {
      // Given
      const state = REPORT_MODE_POSITION_1_STATE;

      // When
      const result = selectActiveSimulation(state);

      // Then
      expect(result).toEqual(mockSimulation2);
    });

    test('given null at active position then returns null', () => {
      // Given
      const state = STATE_WITH_NULL_AT_POSITION;

      // When
      const result = selectActiveSimulation(state);

      // Then
      expect(result).toBeNull();
    });

    test('given all simulations are null then returns null', () => {
      // Given
      const state = STATE_WITH_ALL_NULL;

      // When
      const result = selectActiveSimulation(state);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('selectActivePolicy', () => {
    test('given standalone mode then returns policy at position 0', () => {
      // Given
      const state = STANDALONE_MODE_STATE;

      // When
      const result = selectActivePolicy(state);

      // Then
      expect(result).toEqual(mockPolicy1);
    });

    test('given report mode with position 0 then returns policy at position 0', () => {
      // Given
      const state = REPORT_MODE_POSITION_0_STATE;

      // When
      const result = selectActivePolicy(state);

      // Then
      expect(result).toEqual(mockPolicy1);
    });

    test('given report mode with position 1 then returns policy at position 1', () => {
      // Given
      const state = REPORT_MODE_POSITION_1_STATE;

      // When
      const result = selectActivePolicy(state);

      // Then
      expect(result).toEqual(mockPolicy2);
    });

    test('given null at active position then returns null', () => {
      // Given
      const state = STATE_WITH_NULL_AT_POSITION;

      // When
      const result = selectActivePolicy(state);

      // Then
      expect(result).toBeNull();
    });

    test('given all policies are null then returns null', () => {
      // Given
      const state = STATE_WITH_ALL_NULL;

      // When
      const result = selectActivePolicy(state);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('selectActivePopulation', () => {
    test('given standalone mode then returns population at position 0', () => {
      // Given
      const state = STANDALONE_MODE_STATE;

      // When
      const result = selectActivePopulation(state);

      // Then
      expect(result).toEqual(mockPopulation1);
    });

    test('given report mode with position 0 then returns population at position 0', () => {
      // Given
      const state = REPORT_MODE_POSITION_0_STATE;

      // When
      const result = selectActivePopulation(state);

      // Then
      expect(result).toEqual(mockPopulation1);
    });

    test('given report mode with position 1 then returns population at position 1', () => {
      // Given
      const state = REPORT_MODE_POSITION_1_STATE;

      // When
      const result = selectActivePopulation(state);

      // Then
      expect(result).toEqual(mockPopulation2);
    });

    test('given null at active position then returns null', () => {
      // Given
      const state = STATE_WITH_NULL_AT_POSITION;

      // When
      const result = selectActivePopulation(state);

      // Then
      expect(result).toBeNull();
    });

    test('given all populations are null then returns null', () => {
      // Given
      const state = STATE_WITH_ALL_NULL;

      // When
      const result = selectActivePopulation(state);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('selectCurrentPosition', () => {
    test('given standalone mode then returns 0', () => {
      // Given
      const state = STANDALONE_MODE_STATE;

      // When
      const result = selectCurrentPosition(state);

      // Then
      expect(result).toBe(0);
    });

    test('given report mode with position 0 then returns 0', () => {
      // Given
      const state = REPORT_MODE_POSITION_0_STATE;

      // When
      const result = selectCurrentPosition(state);

      // Then
      expect(result).toBe(0);
    });

    test('given report mode with position 1 then returns 1', () => {
      // Given
      const state = REPORT_MODE_POSITION_1_STATE;

      // When
      const result = selectCurrentPosition(state);

      // Then
      expect(result).toBe(1);
    });

    test('given standalone mode with activePosition 1 then still returns 0', () => {
      // Given
      const state = STANDALONE_MODE_STATE; // Has activePosition: 1 but mode is standalone

      // When
      const result = selectCurrentPosition(state);

      // Then
      expect(result).toBe(0); // Should ignore activePosition in standalone mode
    });
  });
});