import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
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
    it('given economy type then returns SocietyWideCalcStrategy instance', () => {
      // When
      const strategy = CalcStrategyFactory.getStrategy('societyWide');

      // Then
      expect(strategy).toBeInstanceOf(SocietyWideCalcStrategy);
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
      const strategy1 = CalcStrategyFactory.getStrategy('societyWide');
      const strategy2 = CalcStrategyFactory.getStrategy('societyWide');

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
      const economyStrategy = CalcStrategyFactory.getStrategy('societyWide');
      const householdStrategy = CalcStrategyFactory.getStrategy('household');

      // Then - different types have different instances
      expect(economyStrategy).not.toBe(householdStrategy);
    });

    it('given reset then creates new instances', () => {
      // Given
      const strategy1 = CalcStrategyFactory.getStrategy('societyWide');

      // When
      CalcStrategyFactory.reset();
      const strategy2 = CalcStrategyFactory.getStrategy('societyWide');

      // Then - new instance after reset
      expect(strategy1).not.toBe(strategy2);
    });
  });
});
