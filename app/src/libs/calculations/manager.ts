import { QueryClient } from '@tanstack/react-query';
import { markReportCompleted, markReportError } from '@/api/report';
import { CalculationMeta } from '@/api/reportCalculations';
import { updateSimulationOutput } from '@/api/simulation';
import { countryIds } from '@/libs/countries';
import { Report, ReportOutput } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
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
    // Create callbacks
    const callbacks = {
      onComplete: async (completedReportId: string, status: 'ok' | 'error', result?: any) => {
        console.log('[CalculationManager] Calculation completed:', completedReportId, status);

        if (!this.reportStatusTracking.get(completedReportId)) {
          this.reportStatusTracking.set(completedReportId, true);
          await this.updateReportStatus(
            completedReportId,
            status === 'ok' ? 'complete' : 'error',
            meta.countryId,
            result,
            meta
          );
        }
      },
      onSimulationComplete:
        meta.type === 'household'
          ? async (simulationId: string, result: any, policyId: string) => {
              console.log('[CalculationManager] Simulation completed:', simulationId);

              const simulation: Simulation = {
                id: simulationId,
                countryId: meta.countryId,
                policyId,
                populationId: meta.populationId,
                populationType: 'household',
                label: null,
                isCreated: true,
                output: result,
              };

              await updateSimulationOutput(meta.countryId, simulationId, simulation);
            }
          : undefined,
    };

    // Execute calculation with callbacks
    const result = await this.service.executeCalculation(reportId, meta, callbacks);

    // For economy calculations, update immediately if complete
    if (meta.type === 'economy' && !this.reportStatusTracking.get(reportId)) {
      if (result.status === 'ok' || result.status === 'error') {
        this.reportStatusTracking.set(reportId, true);
        await this.updateReportStatus(
          reportId,
          result.status === 'ok' ? 'complete' : 'error',
          meta.countryId,
          result.result,
          meta
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
      const handler = this.service.getHandler('household');
      if (!handler.isActive(reportId)) {
        // Create callbacks
        const callbacks = {
          onComplete: async (completedReportId: string, status: 'ok' | 'error', result?: any) => {
            console.log('[CalculationManager] Calculation completed:', completedReportId, status);

            if (!this.reportStatusTracking.get(completedReportId)) {
              this.reportStatusTracking.set(completedReportId, true);
              await this.updateReportStatus(
                completedReportId,
                status === 'ok' ? 'complete' : 'error',
                meta.countryId,
                result,
                meta
              );
            }
          },
          onSimulationComplete: async (simulationId: string, result: any, policyId: string) => {
            console.log('[CalculationManager] Simulation completed:', simulationId);

            const simulation: Simulation = {
              id: simulationId,
              countryId: meta.countryId,
              policyId,
              populationId: meta.populationId,
              populationType: 'household',
              label: null,
              isCreated: true,
              output: result,
            };

            await updateSimulationOutput(meta.countryId, simulationId, simulation);
          },
        };

        // Start the calculation with callbacks
        await this.service.executeCalculation(reportId, meta, callbacks);
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
   * For household calculations, output is null (stored in Simulations)
   * For economy calculations, output contains the comparison results
   */
  async updateReportStatus(
    reportId: string,
    status: 'complete' | 'error',
    countryId: (typeof countryIds)[number],
    result?: ReportOutput,
    calculationMeta?: CalculationMeta
  ): Promise<void> {
    // Create a minimal Report object with just the necessary fields
    // For household: output is null (stored in Simulation)
    // For economy: output contains the comparison results
    const report: Report = {
      id: reportId,
      status,
      output:
        status === 'complete' && calculationMeta?.type !== 'household' ? result || null : null,
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
