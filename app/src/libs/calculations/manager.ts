import { QueryClient } from '@tanstack/react-query';
import { CalculationMeta } from '@/api/reportCalculations';
import {
  CalculationHandler,
  EconomyCalculationHandler,
  HouseholdCalculationHandler,
} from './handlers';
import { CalculationStatusResponse } from './status';
import { CalculationType } from './types';

export class CalculationManager {
  private handlers: Map<CalculationType, CalculationHandler>;

  constructor(queryClient: QueryClient) {
    this.handlers = new Map([
      ['household', new HouseholdCalculationHandler(queryClient)],
      ['economy', new EconomyCalculationHandler(queryClient)],
    ]);
  }

  getHandler(type: CalculationType): CalculationHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler for calculation type: ${type}`);
    }
    return handler;
  }

  /**
   * Fetch a calculation using its metadata
   * For economy calculations, this triggers a fresh API call
   * For household calculations, this returns existing calculation status if one matches the metadata
   */
  async fetchCalculation(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    const handler = this.getHandler(meta.type);
    return handler.fetch(meta);
  }

  /**
   * Start a calculation for a specific report
   * Both household and economy calculations are tracked by reportId
   * @param reportId - The report ID to associate with this calculation
   * @param meta - The metadata to configure the calculation
   */
  async startCalculation(reportId: string, meta: CalculationMeta): Promise<void> {
    const handler = this.getHandler(meta.type);
    await handler.startCalculation(reportId, meta);
  }

  /**
   * Get the status of a calculation by report ID
   * @param reportId - The report ID to look up
   * @param type - The type of calculation (needed to select the right handler)
   */
  getStatus(reportId: string, type: CalculationType): CalculationStatusResponse | null {
    const handler = this.getHandler(type);
    return handler.getStatus(reportId);
  }

  /**
   * Get the cache key for a calculation
   * This returns ['calculation', reportId] for consistency across all calculation types
   * @param reportId - The report ID
   * @param type - The type of calculation
   */
  getCacheKey(reportId: string, type: CalculationType): readonly string[] {
    const handler = this.getHandler(type);
    return handler.getCacheKey(reportId);
  }
}

// Singleton instance
let managerInstance: CalculationManager | null = null;

/**
 * Get the singleton instance of the CalculationManager
 * Creates a new instance if one doesn't exist
 * @param queryClient - The QueryClient to use for cache operations
 */
export function getCalculationManager(queryClient: QueryClient): CalculationManager {
  if (!managerInstance) {
    managerInstance = new CalculationManager(queryClient);
  }
  return managerInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetCalculationManager(): void {
  managerInstance = null;
}
