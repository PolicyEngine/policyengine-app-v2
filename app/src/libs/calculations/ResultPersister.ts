import { QueryClient } from '@tanstack/react-query';
import { markReportCompleted } from '@/api/report';
import { updateSimulationOutput } from '@/api/simulation';
import { reportKeys, simulationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';

/**
 * Persists calculation results to the appropriate backend resource
 * Supports polymorphic persistence to either reports or simulations
 */
export class ResultPersister {
  constructor(private queryClient: QueryClient) {}

  /**
   * Persist calculation result based on target type
   * @param status - The completed calculation status with result
   * @param countryId - Country ID for API calls
   * @throws Error if persistence fails after retry
   */
  async persist(status: CalcStatus, countryId: string): Promise<void> {
    console.log(
      `[ResultPersister] Persisting ${status.metadata.targetType} result for: ${status.metadata.calcId}`
    );

    if (!status.result) {
      throw new Error('Cannot persist: result is missing from CalcStatus');
    }

    try {
      if (status.metadata.targetType === 'report') {
        await this.persistToReport(status.metadata.calcId, status.result, countryId);
      } else {
        await this.persistToSimulation(status.metadata.calcId, status.result, countryId);
      }
      console.log(`[ResultPersister] Successfully persisted to ${status.metadata.targetType}`);
    } catch (error) {
      console.error(`[ResultPersister] Persistence failed, retrying once...`, error);
      // Retry once after 1 second
      await this.sleep(1000);
      try {
        if (status.metadata.targetType === 'report') {
          await this.persistToReport(status.metadata.calcId, status.result, countryId);
        } else {
          await this.persistToSimulation(status.metadata.calcId, status.result, countryId);
        }
        console.log(`[ResultPersister] Retry successful`);
      } catch (retryError) {
        console.error(`[ResultPersister] Retry failed`, retryError);
        throw new Error(
          `Failed to persist ${status.metadata.targetType} after retry: ${retryError}`
        );
      }
    }
  }

  /**
   * Persist result to a report
   */
  private async persistToReport(
    reportId: string,
    result: any,
    countryId: string
  ): Promise<void> {
    // Create a Report object with the result
    const report: Report = {
      id: reportId,
      countryId: countryId as any,
      apiVersion: null,
      simulationIds: [],
      status: 'complete',
      output: result,
    };

    // Use existing markReportCompleted API
    await markReportCompleted(countryId as any, reportId, report);

    // Invalidate report metadata cache so Reports page shows updated status
    // WHY: Reports page reads from reportKeys.byId(), not calculation cache.
    // After persisting to database, we need to invalidate so next fetch gets fresh data.
    // This is safe because database persistence is complete at this point.
    console.log(`[ResultPersister] → Invalidating report cache for ${reportId}`);
    this.queryClient.invalidateQueries({
      queryKey: reportKeys.byId(reportId),
    });
    console.log(`[ResultPersister] ✓ Report cache invalidated, Reports page will show updated status`);
  }

  /**
   * Persist result to a simulation
   */
  private async persistToSimulation(
    simulationId: string,
    result: any,
    countryId: string
  ): Promise<void> {
    // Use new updateSimulationOutput API
    await updateSimulationOutput(countryId as any, simulationId, result);

    // Invalidate simulation metadata cache so Reports page shows updated status
    // WHY: Reports page may display simulation info, and we need fresh data after persistence.
    // This is safe because database persistence is complete at this point.
    console.log(`[ResultPersister] → Invalidating simulation cache for ${simulationId}`);
    this.queryClient.invalidateQueries({
      queryKey: simulationKeys.byId(simulationId),
    });
    console.log(`[ResultPersister] ✓ Simulation cache invalidated`);
  }

  /**
   * Sleep helper for retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
