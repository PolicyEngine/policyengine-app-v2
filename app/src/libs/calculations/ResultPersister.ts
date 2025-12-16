import { QueryClient } from '@tanstack/react-query';
import { markReportCompleted } from '@/api/report';
import { updateSimulationOutput } from '@/api/simulation';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
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
   * @param year - Report year for persistence
   * @throws Error if persistence fails after retry
   */
  async persist(status: CalcStatus, countryId: string, year: string): Promise<void> {
    if (!status.result) {
      throw new Error('Cannot persist: result is missing from CalcStatus');
    }

    try {
      if (status.metadata.targetType === 'report') {
        await this.persistToReport(status.metadata.calcId, status.result, countryId, year);
      } else {
        await this.persistToSimulation(
          status.metadata.calcId,
          status.result,
          countryId,
          status.metadata.reportId // Pass parent reportId for household sim-level calcs
        );
      }
    } catch (error) {
      console.error('[ResultPersister] Persistence failed, retrying once...', error);
      // Retry once after 1 second
      await this.sleep(1000);
      try {
        if (status.metadata.targetType === 'report') {
          await this.persistToReport(status.metadata.calcId, status.result, countryId, year);
        } else {
          await this.persistToSimulation(
            status.metadata.calcId,
            status.result,
            countryId,
            status.metadata.reportId // Pass parent reportId for household sim-level calcs
          );
        }
      } catch (retryError) {
        console.error('[ResultPersister] Retry failed', retryError);
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
    countryId: string,
    year: string
  ): Promise<void> {
    // Create a Report object with the result
    const report: Report = {
      id: reportId,
      countryId: countryId as any,
      year,
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
    this.queryClient.invalidateQueries({
      queryKey: reportKeys.byId(reportId),
    });
  }

  /**
   * Persist result to a simulation
   *
   * For household reports: After persisting simulation, check if all simulations
   * for the parent report are complete. If yes, mark the report as complete.
   */
  private async persistToSimulation(
    simulationId: string,
    result: any,
    countryId: string,
    reportId?: string
  ): Promise<void> {
    // Use new updateSimulationOutput API
    await updateSimulationOutput(countryId as any, simulationId, result);

    // Invalidate simulation metadata cache so Reports page shows updated status
    // WHY: Reports page may display simulation info, and we need fresh data after persistence.
    // This is safe because database persistence is complete at this point.
    this.queryClient.invalidateQueries({
      queryKey: simulationKeys.byId(simulationId),
    });

    // For household reports: Check if all simulations are complete
    if (reportId) {
      const allSimsComplete = await this.checkAllSimulationsComplete(reportId);

      if (allSimsComplete) {
        // Fetch the report to get its year
        const report = this.queryClient.getQueryData<any>(reportKeys.byId(reportId));
        if (!report?.year) {
          throw new Error(`Cannot persist report ${reportId}: year is missing from report data`);
        }

        // Aggregate outputs from all simulations
        const aggregatedOutput = await this.aggregateSimulationOutputs(reportId);

        // Mark report as complete with aggregated output
        await this.persistToReport(reportId, aggregatedOutput, countryId, report.year);
      }
    }
  }

  /**
   * Check if all simulations for a report are complete
   * @param reportId - Parent report ID
   * @returns true if all simulations have status='complete' in calculation cache
   */
  private async checkAllSimulationsComplete(reportId: string): Promise<boolean> {
    // Get report to find simulation IDs
    const report = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    if (!report) {
      return false;
    }

    // Check each simulation's calculation cache
    for (const simId of report.simulationIds) {
      const simStatus = this.queryClient.getQueryData<CalcStatus>(
        calculationKeys.bySimulationId(simId)
      );

      if (simStatus?.status !== 'complete') {
        return false;
      }
    }

    return true;
  }

  /**
   * Aggregate simulation outputs for a household report
   * @param reportId - Parent report ID
   * @returns Array of household outputs (one per simulation)
   */
  private async aggregateSimulationOutputs(reportId: string): Promise<any> {
    const report = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    if (!report) {
      throw new Error(`Report ${reportId} not found in cache during aggregation`);
    }

    // Get all simulation outputs from calculation cache
    const outputs = report.simulationIds
      .map((simId) => {
        const simStatus = this.queryClient.getQueryData<CalcStatus>(
          calculationKeys.bySimulationId(simId)
        );
        return simStatus?.result;
      })
      .filter((output) => output !== undefined);

    // For household reports, return array of household outputs
    // This matches what HouseholdOverview expects
    return outputs;
  }

  /**
   * Sleep helper for retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
