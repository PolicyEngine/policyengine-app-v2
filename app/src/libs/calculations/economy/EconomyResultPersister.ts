import { QueryClient } from '@tanstack/react-query';
import { markReportCompleted } from '@/api/report';
import { reportKeys, simulationKeys } from '@/libs/queryKeys';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import { BASE_URL } from '@/constants';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';

/**
 * Persists economy calculation results to report records
 *
 * NOTE: This is economy-only. Household results are persisted by HouseholdReportOrchestrator.
 */
export class EconomyResultPersister {
  constructor(private queryClient: QueryClient) {}

  /**
   * Persist economy calculation result to report
   * @param status - The completed calculation status with result
   * @param countryId - Country ID for API calls
   * @throws Error if persistence fails after retry
   */
  async persist(status: CalcStatus, countryId: string): Promise<void> {
    const timestamp = Date.now();
    console.log(`[EconomyResultPersister][${timestamp}] ========================================`);
    console.log(`[EconomyResultPersister][${timestamp}] ⚠️  PERSIST CALLED ⚠️`);
    console.log(`[EconomyResultPersister][${timestamp}] targetType: ${status.metadata.targetType}`);
    console.log(`[EconomyResultPersister][${timestamp}] calcId: ${status.metadata.calcId}`);
    console.log(`[EconomyResultPersister][${timestamp}] status: ${status.status}`);
    console.log(`[EconomyResultPersister][${timestamp}] has result? ${!!status.result}`);

    if (!status.result) {
      console.error(`[EconomyResultPersister][${timestamp}] ❌ ERROR: No result to persist!`);
      throw new Error('Cannot persist: result is missing from CalcStatus');
    }

    // Economy calculations always persist to report
    if (status.metadata.targetType !== 'report') {
      console.error(`[EconomyResultPersister][${timestamp}] ❌ ERROR: Expected targetType 'report', got '${status.metadata.targetType}'`);
      throw new Error(`EconomyResultPersister only handles report-level persistence`);
    }

    try {
      await this.persistToReport(status.metadata.calcId, status.result, countryId);
      console.log(`[EconomyResultPersister] Successfully persisted to report`);
    } catch (error) {
      console.error(`[EconomyResultPersister] Persistence failed, retrying once...`, error);
      // Retry once after 1 second
      await this.sleep(1000);
      try {
        await this.persistToReport(status.metadata.calcId, status.result, countryId);
        console.log(`[EconomyResultPersister] Retry successful`);
      } catch (retryError) {
        console.error(`[EconomyResultPersister] Retry failed`, retryError);
        throw new Error(`Failed to persist report after retry: ${retryError}`);
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
    const timestamp = Date.now();

    // Get report from cache to access simulation IDs
    const reportData = this.queryClient.getQueryData<Report>(
      reportKeys.byId(reportId)
    );

    // Create a Report object with the result
    const report: Report = {
      id: reportId,
      countryId: countryId as any,
      apiVersion: null,
      simulationIds: reportData?.simulationIds || [],
      status: 'complete',
      output: result,
    };

    // Use existing markReportCompleted API
    await markReportCompleted(countryId as any, reportId, report);

    // Mark all simulations complete with placeholder output
    if (report.simulationIds && report.simulationIds.length > 0) {
      console.log(`[EconomyResultPersister][${timestamp}] Marking ${report.simulationIds.length} simulations as complete`);
      await Promise.all(
        report.simulationIds.map(simId =>
          this.markSimulationComplete(countryId, simId)
        )
      );
      console.log(`[EconomyResultPersister][${timestamp}] ✓ All simulations marked complete`);
    }

    // Invalidate report metadata cache so Reports page shows updated status
    console.log(`[EconomyResultPersister] → Invalidating report cache for ${reportId}`);
    this.queryClient.invalidateQueries({
      queryKey: reportKeys.byId(reportId),
    });
    console.log(`[EconomyResultPersister] ✓ Report cache invalidated`);
  }

  /**
   * Mark an economy simulation as complete with placeholder output
   * Economy simulations don't store individual outputs (only the report has aggregated output)
   */
  private async markSimulationComplete(countryId: string, simulationId: string): Promise<void> {
    const timestamp = Date.now();
    try {
      const payload = SimulationAdapter.toEconomyPlaceholderPayload(simulationId);
      const url = `${BASE_URL}/${countryId}/simulation`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to PATCH simulation ${simulationId}: ${response.status} ${response.statusText}`);
      }

      // Invalidate simulation cache
      this.queryClient.invalidateQueries({
        queryKey: simulationKeys.byId(simulationId),
      });

      console.log(`[EconomyResultPersister][${timestamp}] ✓ Simulation ${simulationId} marked complete`);
    } catch (error) {
      console.error(`[EconomyResultPersister][${timestamp}] Failed to mark simulation ${simulationId} complete:`, error);
      // Don't throw - economy report already succeeded, simulation status is secondary
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
