import { describe, it, expect } from 'vitest';
import { CalcParams } from '@/types/calculation';
import {
  mockEconomyCalcParams,
  mockHouseholdCalcParams,
} from '@/tests/fixtures/types/calculationFixtures';

describe('CalcParams types', () => {
  describe('economy calculation params', () => {
    it('should include all required fields for economy calculation', () => {
      const params: CalcParams = mockEconomyCalcParams();

      expect(params.countryId).toBe('us');
      expect(params.calcType).toBe('economy');
      expect(params.policyIds.baseline).toBeDefined();
      expect(params.populationId).toBeDefined();
    });

    it('should support reform policy for comparison', () => {
      const params = mockEconomyCalcParams({
        policyIds: {
          baseline: '1',
          reform: '2',
        },
      });

      expect(params.policyIds.baseline).toBe('1');
      expect(params.policyIds.reform).toBe('2');
    });

    it('should support baseline-only calculation', () => {
      const params = mockEconomyCalcParams({
        policyIds: {
          baseline: '1',
        },
      });

      expect(params.policyIds.baseline).toBe('1');
      expect(params.policyIds.reform).toBeUndefined();
    });

    it('should include region for subnational calculations', () => {
      const params = mockEconomyCalcParams({
        region: 'ca',
        populationId: 'ca',
      });

      expect(params.region).toBe('ca');
    });

    it('should allow omitting region for national calculations', () => {
      const params = mockEconomyCalcParams({
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
      const usParams = mockEconomyCalcParams({ countryId: 'us' });
      const ukParams = mockEconomyCalcParams({ countryId: 'uk' });

      expect(usParams.countryId).toBe('us');
      expect(ukParams.countryId).toBe('uk');
    });
  });

  describe('policy IDs structure', () => {
    it('should always have baseline policy', () => {
      const params = mockEconomyCalcParams();

      expect(params.policyIds).toHaveProperty('baseline');
      expect(typeof params.policyIds.baseline).toBe('string');
    });

    it('should optionally have reform policy', () => {
      const withReform = mockEconomyCalcParams({
        policyIds: { baseline: '1', reform: '2' },
      });
      const withoutReform = mockEconomyCalcParams({
        policyIds: { baseline: '1' },
      });

      expect(withReform.policyIds.reform).toBe('2');
      expect(withoutReform.policyIds.reform).toBeUndefined();
    });
  });
});
