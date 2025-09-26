import { QueryClient } from '@tanstack/react-query';
import { CalculationMeta } from '@/api/reportCalculations';
import { markReportCompleted, markReportError } from '@/api/report';
import { countryIds } from '@/libs/countries';
import { Report } from '@/types/ingredients/Report';
import {
  CalculationHandler,
  EconomyCalculationHandler,
  HouseholdCalculationHandler,
} from './handlers';
import { CalculationStatusResponse } from './status';
import { CalculationType } from './types';

/**
 * CalculationManager orchestrates different types of calculations (household and economy)
 * and handles cross-cutting concerns like report status updates.
 *
 * Architecture Note: This class uses a bidirectional reference pattern with its handlers.
 * The manager creates and owns the handlers, passing itself as a reference. This allows
 * handlers to notify the manager when calculations complete, triggering automatic report
 * status updates in the database. This pattern ensures:
 * - Separation of concerns: Handlers focus on calculations, manager handles reporting
 * - Automatic synchronization: Report status updates happen without external orchestration
 * - Consistent behavior: All calculation types follow the same completion flow
 *
 * The circular reference is intentional and controlled through type-only imports in the
 * handler base class to avoid runtime circular dependencies.
 */
export class CalculationManager {
  private handlers: Map<CalculationType, CalculationHandler>;
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    // Pass 'this' to handlers to enable completion callbacks
    this.handlers = new Map([
      ['household', new HouseholdCalculationHandler(queryClient, this)],
      ['economy', new EconomyCalculationHandler(queryClient, this)],
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

  /**
   * Update the report status in the database when a calculation completes or errors
   * @param reportId - The report ID to update
   * @param status - The new status ('complete' or 'error')
   * @param result - The calculation result (for 'complete' status)
   * @param countryId - The country ID for the report
   */
  async updateReportStatus(
    reportId: string,
    status: 'complete' | 'error',
    countryId: (typeof countryIds)[number],
    result?: any
  ): Promise<void> {
    // Create a minimal Report object with just the necessary fields
    const report: Report = {
      reportId,
      status,
      output: status === 'complete' ? result : null,
      countryId: countryId,
      apiVersion: '',
      simulationIds: [],
    };

    try {
      // Call the appropriate update function based on status
      if (status === 'complete') {
        await markReportCompleted(report.countryId, reportId, report);
      } else {
        await markReportError(report.countryId, reportId, report);
      }

      // Invalidate the report cache to trigger a refresh in the UI
      this.queryClient.invalidateQueries({
        queryKey: ['reports', 'report_id', reportId],
      });
    } catch (error) {
      // One retry attempt with 1-second delay
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (status === 'complete') {
          await markReportCompleted(report.countryId, reportId, report);
        } else {
          await markReportError(report.countryId, reportId, report);
        }

        // Invalidate cache after successful retry
        this.queryClient.invalidateQueries({
          queryKey: ['reports', 'report_id', reportId],
        });
      } catch (retryError) {
        // Log but don't throw - calculation succeeded even if report update failed
        console.error(`Failed to update report ${reportId} status to ${status}:`, retryError);
      }
    }
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
