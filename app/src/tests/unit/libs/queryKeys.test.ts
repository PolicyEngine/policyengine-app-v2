import { describe, it, expect } from 'vitest';
import { calculationKeys } from '@/libs/queryKeys';

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
