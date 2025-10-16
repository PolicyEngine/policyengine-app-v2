import { describe, it, expect } from 'vitest';
import { policiesAreEqual, determinePolicyColumns } from '@/utils/policyComparison';
import {
  MOCK_POLICY_A,
  MOCK_POLICY_B,
  MOCK_POLICY_C,
  MOCK_POLICY_A_CLONE,
  MOCK_EMPTY_POLICY,
} from '@/tests/fixtures/utils/policyComparisonMocks';

describe('policyComparison', () => {
  describe('policiesAreEqual', () => {
    it('returns false when either policy is undefined', () => {
      expect(policiesAreEqual(undefined, MOCK_POLICY_A)).toBe(false);
      expect(policiesAreEqual(MOCK_POLICY_A, undefined)).toBe(false);
      expect(policiesAreEqual(undefined, undefined)).toBe(false);
    });

    it('returns true when policies have the same ID', () => {
      expect(policiesAreEqual(MOCK_POLICY_A, MOCK_POLICY_A)).toBe(true);
    });

    it('returns true when policies have identical parameters', () => {
      expect(policiesAreEqual(MOCK_POLICY_A, MOCK_POLICY_A_CLONE)).toBe(true);
    });

    it('returns false when policies have different parameters', () => {
      expect(policiesAreEqual(MOCK_POLICY_A, MOCK_POLICY_B)).toBe(false);
      expect(policiesAreEqual(MOCK_POLICY_B, MOCK_POLICY_C)).toBe(false);
    });

    it('returns false when parameter counts differ', () => {
      expect(policiesAreEqual(MOCK_POLICY_A, MOCK_EMPTY_POLICY)).toBe(false);
    });

    it('returns true for two empty policies', () => {
      expect(policiesAreEqual(MOCK_EMPTY_POLICY, MOCK_EMPTY_POLICY)).toBe(true);
    });
  });

  describe('determinePolicyColumns', () => {
    it('returns single column when all three policies are equal', () => {
      const columns = determinePolicyColumns(
        MOCK_POLICY_A,
        MOCK_POLICY_A_CLONE,
        MOCK_POLICY_A_CLONE
      );

      expect(columns).toHaveLength(1);
      expect(columns[0].label).toBe('Current Law / Baseline / Reform');
      expect(columns[0].policyLabels).toHaveLength(3);
    });

    it('returns two columns when current law equals baseline', () => {
      const columns = determinePolicyColumns(MOCK_POLICY_A, MOCK_POLICY_A_CLONE, MOCK_POLICY_B);

      expect(columns).toHaveLength(2);
      expect(columns[0].label).toBe('Current Law / Baseline');
      expect(columns[1].label).toBe('Reform');
    });

    it('returns two columns when current law equals reform', () => {
      const columns = determinePolicyColumns(MOCK_POLICY_A, MOCK_POLICY_B, MOCK_POLICY_A_CLONE);

      expect(columns).toHaveLength(2);
      expect(columns[0].label).toBe('Current Law / Reform');
      expect(columns[1].label).toBe('Baseline');
    });

    it('returns two columns when baseline equals reform', () => {
      const columns = determinePolicyColumns(MOCK_POLICY_A, MOCK_POLICY_B, MOCK_POLICY_B);

      expect(columns).toHaveLength(2);
      expect(columns[0].label).toBe('Current Law');
      expect(columns[1].label).toBe('Baseline / Reform');
    });

    it('returns three columns when all policies are different', () => {
      const columns = determinePolicyColumns(MOCK_POLICY_A, MOCK_POLICY_B, MOCK_POLICY_C);

      expect(columns).toHaveLength(3);
      expect(columns[0].label).toBe('Current Law');
      expect(columns[1].label).toBe('Baseline');
      expect(columns[2].label).toBe('Reform');
    });

    it('handles household reports with only baseline and reform', () => {
      const columns = determinePolicyColumns(undefined, MOCK_POLICY_A, MOCK_POLICY_B);

      expect(columns).toHaveLength(2);
      expect(columns[0].label).toBe('Baseline');
      expect(columns[1].label).toBe('Reform');
    });

    it('merges baseline and reform when equal in household reports', () => {
      const columns = determinePolicyColumns(undefined, MOCK_POLICY_A, MOCK_POLICY_A_CLONE);

      expect(columns).toHaveLength(1);
      expect(columns[0].label).toBe('Baseline / Reform');
    });

    it('handles single policy scenarios', () => {
      const columnsCurrentLaw = determinePolicyColumns(MOCK_POLICY_A, undefined, undefined);
      expect(columnsCurrentLaw).toHaveLength(1);
      expect(columnsCurrentLaw[0].label).toBe('Current Law');

      const columnsBaseline = determinePolicyColumns(undefined, MOCK_POLICY_A, undefined);
      expect(columnsBaseline).toHaveLength(1);
      expect(columnsBaseline[0].label).toBe('Baseline');

      const columnsReform = determinePolicyColumns(undefined, undefined, MOCK_POLICY_A);
      expect(columnsReform).toHaveLength(1);
      expect(columnsReform[0].label).toBe('Reform');
    });

    it('includes policy labels in column data', () => {
      const columns = determinePolicyColumns(MOCK_POLICY_A, MOCK_POLICY_B, MOCK_POLICY_C);

      expect(columns[0].policyLabels).toEqual(['Policy A']);
      expect(columns[1].policyLabels).toEqual(['Policy B']);
      expect(columns[2].policyLabels).toEqual(['Policy C']);
    });

    it('includes multiple policy labels for merged columns', () => {
      const columns = determinePolicyColumns(
        MOCK_POLICY_A,
        MOCK_POLICY_A_CLONE,
        MOCK_POLICY_A_CLONE
      );

      expect(columns[0].policyLabels).toEqual(['Policy A', 'Policy A Clone', 'Policy A Clone']);
    });
  });
});
