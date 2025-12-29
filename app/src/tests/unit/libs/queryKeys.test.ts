import { describe, expect, it } from 'vitest';
import { calculationKeys, parameterValueKeys } from '@/libs/queryKeys';
import { TEST_POLICY_IDS } from '@/tests/fixtures/api/v2/apiV2Mocks';

describe('calculationKeys', () => {
  describe('all', () => {
    it('should return base calculations key', () => {
      expect(calculationKeys.all).toEqual(['calculations']);
    });

    it('should be readonly', () => {
      const key = calculationKeys.all;
      expect(Object.isFrozen(key)).toBe(false); // 'as const' doesn't freeze at runtime
      expect(key).toHaveLength(1);
    });
  });

  describe('byReportId', () => {
    it('should return calculation key for a report', () => {
      const reportId = 'report-123';
      const key = calculationKeys.byReportId(reportId);

      expect(key).toEqual(['calculations', 'report', 'report-123']);
    });

    it('should handle different report IDs', () => {
      const key1 = calculationKeys.byReportId('report-1');
      const key2 = calculationKeys.byReportId('report-2');

      expect(key1).toEqual(['calculations', 'report', 'report-1']);
      expect(key2).toEqual(['calculations', 'report', 'report-2']);
      expect(key1).not.toEqual(key2);
    });

    it('should be type-safe', () => {
      const key = calculationKeys.byReportId('123');
      // TypeScript should infer the exact tuple type
      const _typeCheck: readonly ['calculations', 'report', string] = key;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('bySimulationId', () => {
    it('should return calculation key for a simulation', () => {
      const simId = 'sim-456';
      const key = calculationKeys.bySimulationId(simId);

      expect(key).toEqual(['calculations', 'simulation', 'sim-456']);
    });

    it('should handle different simulation IDs', () => {
      const key1 = calculationKeys.bySimulationId('sim-1');
      const key2 = calculationKeys.bySimulationId('sim-2');

      expect(key1).toEqual(['calculations', 'simulation', 'sim-1']);
      expect(key2).toEqual(['calculations', 'simulation', 'sim-2']);
      expect(key1).not.toEqual(key2);
    });

    it('should be type-safe', () => {
      const key = calculationKeys.bySimulationId('123');
      // TypeScript should infer the exact tuple type
      const _typeCheck: readonly ['calculations', 'simulation', string] = key;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('key uniqueness', () => {
    it('should generate unique keys for different entity types', () => {
      const reportKey = calculationKeys.byReportId('123');
      const simKey = calculationKeys.bySimulationId('123');

      expect(reportKey).not.toEqual(simKey);
      expect(reportKey[1]).toBe('report');
      expect(simKey[1]).toBe('simulation');
    });
  });
});

describe('parameterValueKeys', () => {
  const TEST_PARAMETER_ID = 'param-123';

  describe('all', () => {
    it('given base key then returns parameter-values array', () => {
      expect(parameterValueKeys.all).toEqual(['parameter-values']);
    });

    it('given base key then has correct length', () => {
      expect(parameterValueKeys.all).toHaveLength(1);
    });
  });

  describe('byPolicyAndParameter', () => {
    it('given policy and parameter IDs then returns correct key structure', () => {
      // When
      const key = parameterValueKeys.byPolicyAndParameter(
        TEST_POLICY_IDS.BASELINE,
        TEST_PARAMETER_ID
      );

      // Then
      expect(key).toEqual([
        'parameter-values',
        'policy',
        TEST_POLICY_IDS.BASELINE,
        'parameter',
        TEST_PARAMETER_ID,
      ]);
    });

    it('given different policy ID then generates unique key', () => {
      // When
      const baselineKey = parameterValueKeys.byPolicyAndParameter(
        TEST_POLICY_IDS.BASELINE,
        TEST_PARAMETER_ID
      );
      const reformKey = parameterValueKeys.byPolicyAndParameter(
        TEST_POLICY_IDS.REFORM,
        TEST_PARAMETER_ID
      );

      // Then
      expect(baselineKey).not.toEqual(reformKey);
      expect(baselineKey[2]).toBe(TEST_POLICY_IDS.BASELINE);
      expect(reformKey[2]).toBe(TEST_POLICY_IDS.REFORM);
    });

    it('given different parameter ID then generates unique key', () => {
      // When
      const key1 = parameterValueKeys.byPolicyAndParameter(TEST_POLICY_IDS.BASELINE, 'param-1');
      const key2 = parameterValueKeys.byPolicyAndParameter(TEST_POLICY_IDS.BASELINE, 'param-2');

      // Then
      expect(key1).not.toEqual(key2);
      expect(key1[4]).toBe('param-1');
      expect(key2[4]).toBe('param-2');
    });

    it('given key then policy comes before parameter in structure', () => {
      // When
      const key = parameterValueKeys.byPolicyAndParameter(
        TEST_POLICY_IDS.BASELINE,
        TEST_PARAMETER_ID
      );

      // Then
      expect(key[1]).toBe('policy');
      expect(key[3]).toBe('parameter');
    });

    it('given key then is type-safe', () => {
      // When
      const key = parameterValueKeys.byPolicyAndParameter(
        TEST_POLICY_IDS.BASELINE,
        TEST_PARAMETER_ID
      );

      // Then - TypeScript should infer the exact tuple type
      const _typeCheck: readonly ['parameter-values', 'policy', string, 'parameter', string] = key;
      expect(_typeCheck).toBeDefined();
    });
  });
});
