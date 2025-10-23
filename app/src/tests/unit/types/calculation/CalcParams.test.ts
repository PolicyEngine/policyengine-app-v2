import { describe, expect, it } from 'vitest';
import {
  mockHouseholdCalcParams,
  mockSocietyWideCalcParams,
} from '@/tests/fixtures/types/calculationFixtures';
import { CalcParams } from '@/types/calculation';

describe('CalcParams types', () => {
  describe('economy calculation params', () => {
    it('should include all required fields for economy calculation', () => {
      const params: CalcParams = mockSocietyWideCalcParams();

      expect(params.countryId).toBe('us');
      expect(params.calcType).toBe('societyWide');
      expect(params.policyIds.baseline).toBeDefined();
      expect(params.populationId).toBeDefined();
    });

    it('should support reform policy for comparison', () => {
      const params = mockSocietyWideCalcParams({
        policyIds: {
          baseline: '1',
          reform: '2',
        },
      });

      expect(params.policyIds.baseline).toBe('1');
      expect(params.policyIds.reform).toBe('2');
    });

    it('should support baseline-only calculation', () => {
      const params = mockSocietyWideCalcParams({
        policyIds: {
          baseline: '1',
        },
      });

      expect(params.policyIds.baseline).toBe('1');
      expect(params.policyIds.reform).toBeUndefined();
    });

    it('should include region for subnational calculations', () => {
      const params = mockSocietyWideCalcParams({
        region: 'ca',
        populationId: 'ca',
      });

      expect(params.region).toBe('ca');
    });

    it('should allow omitting region for national calculations', () => {
      const params = mockSocietyWideCalcParams({
        region: undefined,
      });

      expect(params.region).toBeUndefined();
    });
  });

  describe('household calculation params', () => {
    it('should include all required fields for household calculation', () => {
      const params: CalcParams = mockHouseholdCalcParams();

      expect(params.countryId).toBe('us');
      expect(params.calcType).toBe('household');
      expect(params.policyIds.baseline).toBeDefined();
      expect(params.populationId).toBeDefined();
    });

    it('should use household ID as populationId', () => {
      const params = mockHouseholdCalcParams({
        populationId: 'household-abc123',
      });

      expect(params.populationId).toBe('household-abc123');
      expect(params.calcType).toBe('household');
    });

    it('should support baseline-only household calculation', () => {
      const params = mockHouseholdCalcParams({
        policyIds: {
          baseline: '5',
        },
      });

      expect(params.policyIds.baseline).toBe('5');
      expect(params.policyIds.reform).toBeUndefined();
    });

    it('should not require region for household calculations', () => {
      const params = mockHouseholdCalcParams();

      expect(params.region).toBeUndefined();
    });
  });

  describe('country ID validation', () => {
    it('should accept valid country IDs', () => {
      const usParams = mockSocietyWideCalcParams({ countryId: 'us' });
      const ukParams = mockSocietyWideCalcParams({ countryId: 'uk' });

      expect(usParams.countryId).toBe('us');
      expect(ukParams.countryId).toBe('uk');
    });
  });

  describe('policy IDs structure', () => {
    it('should always have baseline policy', () => {
      const params = mockSocietyWideCalcParams();

      expect(params.policyIds).toHaveProperty('baseline');
      expect(typeof params.policyIds.baseline).toBe('string');
    });

    it('should optionally have reform policy', () => {
      const withReform = mockSocietyWideCalcParams({
        policyIds: { baseline: '1', reform: '2' },
      });
      const withoutReform = mockSocietyWideCalcParams({
        policyIds: { baseline: '1' },
      });

      expect(withReform.policyIds.reform).toBe('2');
      expect(withoutReform.policyIds.reform).toBeUndefined();
    });
  });
});
