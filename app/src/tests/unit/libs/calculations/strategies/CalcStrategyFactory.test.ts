import { describe, it, expect } from 'vitest';
import { CalcStrategyFactory } from '@/libs/calculations/strategies/CalcStrategyFactory';
import { EconomyCalcStrategy } from '@/libs/calculations/strategies/EconomyCalcStrategy';
import { HouseholdCalcStrategy } from '@/libs/calculations/strategies/HouseholdCalcStrategy';

describe('CalcStrategyFactory', () => {
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

    it('given economy type then returns new instance each time', () => {
      // When
      const strategy1 = CalcStrategyFactory.getStrategy('economy');
      const strategy2 = CalcStrategyFactory.getStrategy('economy');

      // Then
      expect(strategy1).not.toBe(strategy2);
    });

    it('given household type then returns new instance each time', () => {
      // When
      const strategy1 = CalcStrategyFactory.getStrategy('household');
      const strategy2 = CalcStrategyFactory.getStrategy('household');

      // Then
      expect(strategy1).not.toBe(strategy2);
    });

    it('given unknown type then throws error', () => {
      // When/Then
      expect(() => {
        CalcStrategyFactory.getStrategy('invalid' as any);
      }).toThrow('Unknown calculation type');
    });
  });
});
