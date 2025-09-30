import { QueryClient } from '@tanstack/react-query';
import { markReportCompleted, markReportError } from '@/api/report';
import { CalculationMeta } from '@/api/reportCalculations';
import { countryIds } from '@/libs/countries';
import { Report, ReportOutput } from '@/types/ingredients/Report';
import { HouseholdProgressUpdater } from './progressUpdater';
import { CalculationService, getCalculationService } from './service';
import { CalculationStatusResponse } from './status';

/**
 * CalculationManager orchestrates the service-based architecture with TanStack Query.
 * It delegates to CalculationService for core logic and handles cross-cutting concerns
 * like report status updates and progress monitoring.
 */
export class CalculationManager {
  private service: CalculationService;
  private queryClient: QueryClient;
  private progressUpdater: HouseholdProgressUpdater;
  private reportStatusTracking = new Map<string, boolean>();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.service = getCalculationService();
    this.progressUpdater = new HouseholdProgressUpdater(queryClient);
  }

  /**
   * Execute a calculation and update report status when complete
   * This is the main entry point for running calculations through TanStack Query
   */
  async fetchCalculation(
    reportId: string,
    meta: CalculationMeta
  ): Promise<CalculationStatusResponse> {
    // Create completion callback for household calculations
    const onComplete = async (completedReportId: string, status: 'ok' | 'error', result?: any) => {
      console.log(
        '[CalculationManager] Household calculation completed:',
        completedReportId,
        status
      );

      // Check if we haven't already updated this report
      if (!this.reportStatusTracking.get(completedReportId)) {
        this.reportStatusTracking.set(completedReportId, true);
        await this.updateReportStatus(
          completedReportId,
          status === 'ok' ? 'complete' : 'error',
          meta.countryId,
          result
        );
      }
    };

    // Execute calculation with callback for household
    const result = await this.service.executeCalculation(
      reportId,
      meta,
      meta.type === 'household' ? onComplete : undefined
    );

    // For economy calculations, update immediately if complete
    // (household updates happen via callback)
    if (meta.type === 'economy' && !this.reportStatusTracking.get(reportId)) {
      if (result.status === 'ok' || result.status === 'error') {
        this.reportStatusTracking.set(reportId, true);
        await this.updateReportStatus(
          reportId,
          result.status === 'ok' ? 'complete' : 'error',
          meta.countryId,
          result.result
        );
      }
    }

    return result;
  }

  /**
   * Start a calculation for a specific report
   * For household calculations, this also starts progress updates
   */
  async startCalculation(reportId: string, meta: CalculationMeta): Promise<void> {
    // Reset tracking for this report
    this.reportStatusTracking.delete(reportId);

    if (meta.type === 'household') {
      // For household, check if already running
      const handler = this.service.getHandler('household');
      if (!handler.isActive(reportId)) {
        // Create completion callback for household
        const onComplete = async (
          completedReportId: string,
          status: 'ok' | 'error',
          result?: any
        ) => {
          console.log(
            '[CalculationManager.startCalculation] Household completed:',
            completedReportId,
            status
          );

          // Check if we haven't already updated this report
          if (!this.reportStatusTracking.get(completedReportId)) {
            this.reportStatusTracking.set(completedReportId, true);
            await this.updateReportStatus(
              completedReportId,
              status === 'ok' ? 'complete' : 'error',
              meta.countryId,
              result
            );
          }
        };

        // Start the calculation with callback
        await this.service.executeCalculation(reportId, meta, onComplete);
        // Start progress updates
        this.progressUpdater.startProgressUpdates(reportId, handler as any);
      }
    }
    // For economy, we don't need to do anything special
    // The polling will handle it
  }

  /**
   * Get the status of a calculation by report ID
   */
  getStatus(reportId: string, type: 'household' | 'economy'): CalculationStatusResponse | null {
    return this.service.getStatus(reportId, type);
  }

  /**
   * Get the cache key for a calculation
   */
  getCacheKey(reportId: string): readonly string[] {
    return ['calculation', reportId] as const;
  }

  /**
   * Get query options for a calculation
   */
  getQueryOptions(reportId: string, meta: CalculationMeta) {
    return this.service.getQueryOptions(reportId, meta);
  }

  /**
   * Build metadata from simulation and population data
   */
  buildMetadata(...args: Parameters<CalculationService['buildMetadata']>) {
    return this.service.buildMetadata(...args);
  }

  /**
   * Update the report status in the database when a calculation completes or errors
   */
  async updateReportStatus(
    reportId: string,
    status: 'complete' | 'error',
    countryId: (typeof countryIds)[number],
    result?: ReportOutput
  ): Promise<void> {
    // Create a minimal Report object with just the necessary fields
    // Both household and society-wide results are stored in the output field
    const report: Report = {
      id: reportId,
      status,
      output: status === 'complete' ? result || null : null,
      countryId,
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
        await new Promise((resolve) => setTimeout(resolve, 1000));

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
