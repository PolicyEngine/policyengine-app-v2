import { EconomyCalcStrategy } from './EconomyCalcStrategy';
import { HouseholdCalcStrategy } from './HouseholdCalcStrategy';
import { CalcExecutionStrategy } from './types';

/**
 * Factory for creating calculation strategies using singleton pattern
 * Returns the appropriate strategy based on calculation type
 *
 * WHY SINGLETON: Strategies are stateless (no ProgressTracker dependency after Phase 2).
 * Reusing instances improves performance and reduces memory overhead.
 */
export class CalcStrategyFactory {
  private static economyStrategy: EconomyCalcStrategy | null = null;
  private static householdStrategy: HouseholdCalcStrategy | null = null;

  /**
   * Get the appropriate strategy for a calculation type (singleton)
   * @param type - The type of calculation ('economy' or 'household')
   * @returns Strategy instance for executing the calculation
   */
  static getStrategy(type: 'economy' | 'household'): CalcExecutionStrategy {
    switch (type) {
      case 'economy':
        if (!this.economyStrategy) {
          this.economyStrategy = new EconomyCalcStrategy();
        }
        return this.economyStrategy;
      case 'household':
        if (!this.householdStrategy) {
          this.householdStrategy = new HouseholdCalcStrategy();
        }
        return this.householdStrategy;
      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }
  }

  /**
   * Reset strategies (useful for testing)
   */
  static reset(): void {
    this.economyStrategy = null;
    this.householdStrategy = null;
  }
}
