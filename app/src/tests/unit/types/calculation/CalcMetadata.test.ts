import { describe, expect, it } from 'vitest';
import { mockCalcMetadata } from '@/tests/fixtures/types/calculationFixtures';
import { CalcMetadata } from '@/types/calculation';

describe('CalcMetadata types', () => {
  it('should include calcId', () => {
    const metadata: CalcMetadata = mockCalcMetadata({
      calcId: 'report-123',
    });

    expect(metadata.calcId).toBe('report-123');
  });

  it('should include calcType', () => {
    const economyMeta = mockCalcMetadata({ calcType: 'societyWide' });
    const householdMeta = mockCalcMetadata({ calcType: 'household' });

    expect(economyMeta.calcType).toBe('societyWide');
    expect(householdMeta.calcType).toBe('household');
  });

  it('should include targetType for polymorphic persistence', () => {
    const reportMeta = mockCalcMetadata({ targetType: 'report' });
    const simMeta = mockCalcMetadata({ targetType: 'simulation' });

    expect(reportMeta.targetType).toBe('report');
    expect(simMeta.targetType).toBe('simulation');
  });

  it('should include startedAt timestamp', () => {
    const now = Date.now();
    const metadata = mockCalcMetadata({ startedAt: now });

    expect(metadata.startedAt).toBe(now);
    expect(typeof metadata.startedAt).toBe('number');
  });

  describe('targetType field', () => {
    it('should support report target', () => {
      const metadata = mockCalcMetadata({
        calcId: 'report-123',
        targetType: 'report',
      });

      expect(metadata.targetType).toBe('report');
      expect(metadata.calcId).toBe('report-123');
    });

    it('should support simulation target', () => {
      const metadata = mockCalcMetadata({
        calcId: 'sim-456',
        targetType: 'simulation',
      });

      expect(metadata.targetType).toBe('simulation');
      expect(metadata.calcId).toBe('sim-456');
    });
  });

  describe('calcType field', () => {
    it('should distinguish economy calculations', () => {
      const metadata = mockCalcMetadata({ calcType: 'societyWide' });
      expect(metadata.calcType).toBe('societyWide');
    });

    it('should distinguish household calculations', () => {
      const metadata = mockCalcMetadata({ calcType: 'household' });
      expect(metadata.calcType).toBe('household');
    });
  });
});
