import { describe, it, expect } from 'vitest';
import { CalcStatus, CalcResult } from '@/types/calculation';
import {
  mockIdleCalcStatus,
  mockComputingCalcStatus,
  mockCompleteCalcStatus,
  mockErrorCalcStatus,
  mockEconomyResult,
  mockHouseholdResult,
} from '@/tests/fixtures/types/calculationFixtures';

describe('CalcStatus types', () => {
  describe('CalcStatus interface', () => {
    it('should accept idle status', () => {
      const status: CalcStatus = mockIdleCalcStatus();

      expect(status.status).toBe('idle');
      expect(status.metadata).toBeDefined();
      expect(status.result).toBeUndefined();
      expect(status.error).toBeUndefined();
    });

    it('should accept computing status with progress', () => {
      const status: CalcStatus = mockComputingCalcStatus({
        progress: 45,
        message: 'Running simulation...',
        queuePosition: 3,
        estimatedTimeRemaining: 60000,
      });

      expect(status.status).toBe('computing');
      expect(status.progress).toBe(45);
      expect(status.message).toBe('Running simulation...');
      expect(status.queuePosition).toBe(3);
      expect(status.estimatedTimeRemaining).toBe(60000);
    });

    it('should accept complete status with result', () => {
      const result = mockEconomyResult();
      const status: CalcStatus = mockCompleteCalcStatus({ result });

      expect(status.status).toBe('complete');
      expect(status.result).toEqual(result);
      expect(status.error).toBeUndefined();
    });

    it('should accept error status with error info', () => {
      const status: CalcStatus = mockErrorCalcStatus({
        error: {
          code: 'TIMEOUT',
          message: 'Calculation timed out',
          retryable: true,
        },
      });

      expect(status.status).toBe('error');
      expect(status.error).toBeDefined();
      expect(status.error?.code).toBe('TIMEOUT');
      expect(status.error?.retryable).toBe(true);
      expect(status.result).toBeUndefined();
    });
  });

  describe('CalcResult type', () => {
    it('should accept economy output', () => {
      const result: CalcResult = mockEconomyResult();

      expect(result).toHaveProperty('budget');
      expect(result).toHaveProperty('decile');
      expect(result).toHaveProperty('poverty');
    });

    it('should accept household data', () => {
      const result: CalcResult = mockHouseholdResult();

      expect(result).toHaveProperty('people');
      expect(result).toHaveProperty('households');
    });
  });

  describe('metadata field', () => {
    it('should include calcId', () => {
      const status = mockComputingCalcStatus({
        metadata: {
          calcId: 'report-123',
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });

      expect(status.metadata.calcId).toBe('report-123');
    });

    it('should include calcType', () => {
      const economyStatus = mockComputingCalcStatus({
        metadata: {
          calcId: 'test',
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });

      const householdStatus = mockComputingCalcStatus({
        metadata: {
          calcId: 'test',
          calcType: 'household',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });

      expect(economyStatus.metadata.calcType).toBe('societyWide');
      expect(householdStatus.metadata.calcType).toBe('household');
    });

    it('should include targetType', () => {
      const reportStatus = mockComputingCalcStatus({
        metadata: {
          calcId: 'test',
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      });

      const simStatus = mockComputingCalcStatus({
        metadata: {
          calcId: 'test',
          calcType: 'societyWide',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      });

      expect(reportStatus.metadata.targetType).toBe('report');
      expect(simStatus.metadata.targetType).toBe('simulation');
    });

    it('should include startedAt timestamp', () => {
      const now = Date.now();
      const status = mockComputingCalcStatus({
        metadata: {
          calcId: 'test',
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: now,
        },
      });

      expect(status.metadata.startedAt).toBe(now);
      expect(typeof status.metadata.startedAt).toBe('number');
    });
  });
});
