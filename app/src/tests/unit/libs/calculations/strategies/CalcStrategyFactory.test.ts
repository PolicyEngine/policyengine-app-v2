import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import { EconomyCalcStrategy } from '@/libs/calculations/strategies/EconomyCalcStrategy';
import { HouseholdCalcStrategy } from '@/libs/calculations/strategies/HouseholdCalcStrategy';

describe('CalcStrategyFactory', () => {
  // Reset singleton instances before each test for isolation
  beforeEach(() => {
    CalcStrategyFactory.reset();
  });

  afterEach(() => {
    CalcStrategyFactory.reset();
  });

  describe('getStrategy', () => {
    it('given economy type then returns EconomyCalcStrategy instance', () => {
      // When
      const strategy = CalcStrategyFactory.getStrategy('economy');

      // Then
      expect(strategy).toBeInstanceOf(EconomyCalcStrategy);
    });

    it('given household type then returns HouseholdCalcStrategy instance', () => {
      // When
      const strategy = CalcStrategyFactory.getStrategy('household');

      // Then
      expect(strategy).toBeInstanceOf(HouseholdCalcStrategy);
    });

    it('given unknown type then throws error', () => {
      // When/Then
      expect(() => {
        CalcStrategyFactory.getStrategy('invalid' as any);
      }).toThrow('Unknown calculation type');
    });
  });

  describe('singleton pattern - Phase 3', () => {
    it('given economy type then returns SAME instance each time', () => {
      // When
      const strategy1 = CalcStrategyFactory.getStrategy('economy');
      const strategy2 = CalcStrategyFactory.getStrategy('economy');

      // Then - same reference
      expect(strategy1).toBe(strategy2);
    });

    it('given household type then returns SAME instance each time', () => {
      // When
      const strategy1 = CalcStrategyFactory.getStrategy('household');
      const strategy2 = CalcStrategyFactory.getStrategy('household');

      // Then - same reference
      expect(strategy1).toBe(strategy2);
    });

    it('given different types then returns different instances', () => {
      // When
      const economyStrategy = CalcStrategyFactory.getStrategy('economy');
      const householdStrategy = CalcStrategyFactory.getStrategy('household');

      // Then - different types have different instances
      expect(economyStrategy).not.toBe(householdStrategy);
    });

    it('given reset then creates new instances', () => {
      // Given
      const strategy1 = CalcStrategyFactory.getStrategy('economy');

      // When
      CalcStrategyFactory.reset();
      const strategy2 = CalcStrategyFactory.getStrategy('economy');

      // Then - new instance after reset
      expect(strategy1).not.toBe(strategy2);
    });
  });
});
