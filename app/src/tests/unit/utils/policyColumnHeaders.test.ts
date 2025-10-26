import { describe, expect, test } from 'vitest';
import {
  MOCK_POLICY_BASELINE,
  MOCK_POLICY_COLUMNS,
  MOCK_POLICY_COLUMNS_MERGED,
  MOCK_USER_POLICY_BASELINE,
  MOCK_USER_POLICY_REFORM,
} from '@/tests/fixtures/utils/policyColumnHeaders';
import { buildColumnHeaderText, getPolicyLabel } from '@/utils/policyColumnHeaders';

describe('policyColumnHeaders', () => {
  describe('getPolicyLabel', () => {
    test('given policy with user label then returns user label', () => {
      // Given / When
      const result = getPolicyLabel(MOCK_POLICY_BASELINE, [MOCK_USER_POLICY_BASELINE]);

      // Then
      expect(result).toBe('My Baseline');
    });

    test('given policy without user label then returns policy label', () => {
      // Given / When
      const result = getPolicyLabel(MOCK_POLICY_BASELINE, []);

      // Then
      expect(result).toBe('Current Law');
    });

    test('given undefined policy then returns default label', () => {
      // Given / When
      const result = getPolicyLabel(undefined, []);

      // Then
      expect(result).toBe('Unnamed Policy');
    });

    test('given policy without label then returns default label', () => {
      // Given
      const policyWithoutLabel = { ...MOCK_POLICY_BASELINE, label: '' };

      // When
      const result = getPolicyLabel(policyWithoutLabel, []);

      // Then
      expect(result).toBe('Unnamed Policy');
    });
  });

  describe('buildColumnHeaderText', () => {
    test('given single policy column then returns policy name with role', () => {
      // Given
      const column = MOCK_POLICY_COLUMNS[0]; // Baseline column

      // When
      const result = buildColumnHeaderText(column, [MOCK_USER_POLICY_BASELINE]);

      // Then
      expect(result).toBe('MY BASELINE (BASELINE)');
    });

    test('given merged policy column then returns policy name with both roles', () => {
      // Given
      const column = MOCK_POLICY_COLUMNS_MERGED[0]; // Baseline / Reform

      // When
      const result = buildColumnHeaderText(column, [MOCK_USER_POLICY_BASELINE]);

      // Then
      expect(result).toBe('MY BASELINE (BASELINE / REFORM)');
    });

    test('given column without user policies then uses policy label', () => {
      // Given
      const column = MOCK_POLICY_COLUMNS[1]; // Reform column

      // When
      const result = buildColumnHeaderText(column, []);

      // Then
      expect(result).toBe('REFORM POLICY (REFORM)');
    });

    test('given column with multiple user policies then uses first match', () => {
      // Given
      const column = MOCK_POLICY_COLUMNS[0]; // Baseline column

      // When
      const result = buildColumnHeaderText(column, [
        MOCK_USER_POLICY_BASELINE,
        MOCK_USER_POLICY_REFORM,
      ]);

      // Then
      expect(result).toBe('MY BASELINE (BASELINE)');
    });
  });
});
