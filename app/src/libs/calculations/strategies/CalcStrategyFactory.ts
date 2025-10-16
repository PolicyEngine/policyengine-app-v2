import { EconomyCalcStrategy } from './EconomyCalcStrategy';
import { HouseholdCalcStrategy } from './HouseholdCalcStrategy';
import { CalcExecutionStrategy } from './types';

/**
 * Factory for creating calculation strategies
 * Returns the appropriate strategy based on calculation type
 */
export class CalcStrategyFactory {
  /**
   * Get the appropriate strategy for a calculation type
   * @param type - The type of calculation ('economy' or 'household')
   * @returns Strategy instance for executing the calculation
   */
  static getStrategy(type: 'economy' | 'household'): CalcExecutionStrategy {
    switch (type) {
      case 'economy':
        return new EconomyCalcStrategy();
      case 'household':
        return new HouseholdCalcStrategy();
      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }
  }
}
