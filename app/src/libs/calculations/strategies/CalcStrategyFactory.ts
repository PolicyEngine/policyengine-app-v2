import { SocietyWideCalcStrategy } from '../economy/SocietyWideCalcStrategy';
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
  private static societyWideStrategy: SocietyWideCalcStrategy | null = null;
  private static householdStrategy: HouseholdCalcStrategy | null = null;

  /**
   * Get the appropriate strategy for a calculation type (singleton)
   * @param type - The type of calculation ('societyWide' or 'household')
   * @returns Strategy instance for executing the calculation
   */
  static getStrategy(type: 'societyWide' | 'household'): CalcExecutionStrategy {
    switch (type) {
      case 'societyWide':
        if (!this.societyWideStrategy) {
          this.societyWideStrategy = new SocietyWideCalcStrategy();
        }
        return this.societyWideStrategy;
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
    this.societyWideStrategy = null;
    this.householdStrategy = null;
  }
}
