import { QueryClient } from '@tanstack/react-query';
import { markReportCompleted, markReportError as persistReportError } from '@/api/report';
import { markSimulationError, updateSimulationOutput } from '@/api/simulation';
import { reportKeys, simulationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

const householdReportFinalizations = new WeakMap<QueryClient, Map<string, Promise<void>>>();

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

    await this.persistWithRetry(async () => {
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
    }, status.metadata.targetType);
  }

  /**
   * Persist a terminal calculation error to the same durable resource as a
   * successful result. Household failures also fail the parent report so a
   * direct reload cannot remain stuck in a pending state forever.
   */
  async persistError(status: CalcStatus, countryId: string, year: string): Promise<void> {
    if (status.status !== 'error') {
      throw new Error('Cannot persist error: CalcStatus is not in an error state');
    }

    try {
      await this.persistErrorOnce(status, countryId, year);
    } catch (error) {
      console.error('[ResultPersister] Error persistence failed, retrying once...', error);
      await this.sleep(1000);

      try {
        await this.persistErrorOnce(status, countryId, year);
      } catch (retryError) {
        console.error('[ResultPersister] Error persistence retry failed', retryError);
        throw new Error(
          `Failed to persist ${status.metadata.targetType} error after retry: ${retryError}`
        );
      }
    }
  }

  /**
   * Idempotently finish a pending household report whose simulation outputs
   * were already persisted before this page load.
   *
   * @returns true when this call completed the report, false when the report
   *          was already complete or not all durable outputs are available.
   */
  async finalizeHouseholdReport(report: Report, simulations: Simulation[]): Promise<boolean> {
    if (!report.id || report.status !== 'pending' || report.simulationIds.length === 0) {
      return false;
    }

    const cachedReport = this.queryClient.getQueryData<Report>(reportKeys.byId(report.id));
    if (cachedReport && cachedReport.status !== 'pending') {
      return false;
    }

    const output = this.aggregateProvidedSimulationOutputs(report, simulations);
    if (!output) {
      return false;
    }

    await this.persistWithRetry(() => this.persistHouseholdReportOnce(report, output), 'report');
    return true;
  }

  /**
   * Persist result to a report
   */
  private async persistToReport(
    reportId: string,
    result: any,
    countryId: string,
    year: string,
    sourceReport?: Report
  ): Promise<void> {
    const cachedReport = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    const existingReport = cachedReport ?? sourceReport;

    // Create a Report object with the result
    const report: Report = {
      ...existingReport,
      id: reportId,
      countryId: countryId as any,
      year,
      apiVersion: existingReport?.apiVersion ?? null,
      simulationIds: existingReport?.simulationIds ?? [],
      status: 'complete',
      output: result,
    };

    // Use existing markReportCompleted API
    await markReportCompleted(countryId as any, reportId, report);

    // Keep the durable-resource cache in sync immediately. This makes report
    // finalization idempotent even while its invalidated query is refetching.
    this.queryClient.setQueryData<Report>(reportKeys.byId(reportId), report);

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

    // Record the successful PATCH in the durable-resource cache before using
    // it as a report-completion barrier. Calculation cache entries become
    // complete before persistence and therefore cannot prove durability.
    const simulationKey = simulationKeys.byId(simulationId);
    const cachedSimulation = this.queryClient.getQueryData<Simulation>(simulationKey);
    this.queryClient.setQueryData<Simulation>(simulationKey, {
      ...(cachedSimulation ?? {
        id: simulationId,
        countryId: countryId as any,
        label: null,
        isCreated: true,
      }),
      output: result,
      status: 'complete',
    });

    // Invalidate simulation metadata cache so Reports page shows updated status
    // WHY: Reports page may display simulation info, and we need fresh data after persistence.
    // This is safe because database persistence is complete at this point.
    this.queryClient.invalidateQueries({
      queryKey: simulationKey,
    });

    // For household reports: Check if all simulations are complete
    if (reportId) {
      const allSimsComplete = this.checkAllSimulationsPersisted(reportId);

      if (allSimsComplete) {
        // Fetch the report to get its year
        const report = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
        if (!report?.year) {
          throw new Error(`Cannot persist report ${reportId}: year is missing from report data`);
        }

        // Aggregate outputs from all simulations
        const aggregatedOutput = this.aggregateSimulationOutputs(reportId);

        // Both inline completion and reload recovery share one in-flight write.
        // This prevents the reload finalizer from racing the last simulation's
        // persistence into a duplicate report PATCH.
        await this.persistHouseholdReportOnce(report, aggregatedOutput);
      }
    }
  }

  private async persistHouseholdReportOnce(
    report: Report,
    output: Record<string, unknown>
  ): Promise<void> {
    if (!report.id) {
      throw new Error('Cannot persist household report: report id is missing');
    }

    let clientFinalizations = householdReportFinalizations.get(this.queryClient);
    if (!clientFinalizations) {
      clientFinalizations = new Map<string, Promise<void>>();
      householdReportFinalizations.set(this.queryClient, clientFinalizations);
    }

    const existingFinalization = clientFinalizations.get(report.id);
    if (existingFinalization) {
      return existingFinalization;
    }

    const reportId = report.id;
    const finalization = this.persistToReport(
      reportId,
      output,
      report.countryId,
      report.year,
      report
    ).finally(() => {
      clientFinalizations?.delete(reportId);
    });
    clientFinalizations.set(reportId, finalization);
    return finalization;
  }

  private async persistErrorOnce(
    status: CalcStatus,
    countryId: string,
    year: string
  ): Promise<void> {
    const errorMessage = status.error?.message;

    if (status.metadata.targetType === 'report') {
      await this.markReportError(status.metadata.calcId, countryId, year, errorMessage);
      return;
    }

    await markSimulationError(countryId as any, status.metadata.calcId, errorMessage);
    this.queryClient.invalidateQueries({
      queryKey: simulationKeys.byId(status.metadata.calcId),
    });

    if (status.metadata.reportId) {
      await this.markReportError(status.metadata.reportId, countryId, year, errorMessage);
    }
  }

  private async markReportError(
    reportId: string,
    countryId: string,
    year: string,
    errorMessage?: string
  ): Promise<void> {
    const cachedReport = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    const report: Report = {
      ...(cachedReport ?? {
        id: reportId,
        countryId: countryId as any,
        year,
        apiVersion: null,
        simulationIds: [],
        status: 'pending',
      }),
      status: 'error',
    };

    await persistReportError(countryId as any, reportId, report, errorMessage);
    this.queryClient.invalidateQueries({
      queryKey: reportKeys.byId(reportId),
    });
  }

  /**
   * Check if all simulations for a report have durable output
   * @param reportId - Parent report ID
   * @returns true if every simulation output came from a fetch or successful PATCH
   */
  private checkAllSimulationsPersisted(reportId: string): boolean {
    // Get report to find simulation IDs
    const report = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    if (!report || report.simulationIds.length === 0) {
      return false;
    }

    // A loaded simulation with durable output either came from the API or was
    // written into this cache only after its PATCH succeeded.
    for (const simId of report.simulationIds) {
      const simulation = this.queryClient.getQueryData<Simulation>(simulationKeys.byId(simId));

      if (
        simulation?.status !== 'complete' ||
        simulation.output === null ||
        simulation.output === undefined
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Aggregate simulation outputs for a household report
   * @param reportId - Parent report ID
   * @returns Simulation-ID-keyed household outputs in the legacy report contract
   */
  private aggregateSimulationOutputs(reportId: string): Record<string, unknown> {
    const report = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    if (!report) {
      throw new Error(`Report ${reportId} not found in cache during aggregation`);
    }

    // Preserve the established report-output contract: a stable map from
    // simulation ID to raw household data. Execution receipts remain on each
    // simulation output, where they can attest to that simulation separately.
    return Object.fromEntries(
      [...report.simulationIds].sort().map((simulationId) => {
        const simulation = this.queryClient.getQueryData<Simulation>(
          simulationKeys.byId(simulationId)
        );
        const output = simulation?.output;
        const householdData = this.unwrapSimulationOutput(output);
        return [simulationId, householdData] as const;
      })
    );
  }

  private aggregateProvidedSimulationOutputs(
    report: Report,
    simulations: Simulation[]
  ): Record<string, unknown> | null {
    const simulationsById = new Map(
      simulations.flatMap((simulation) =>
        simulation.id ? ([[simulation.id, simulation]] as const) : []
      )
    );

    const entries: [string, unknown][] = [];
    for (const simulationId of [...report.simulationIds].sort()) {
      const simulation = simulationsById.get(simulationId);
      if (
        simulation?.status !== 'complete' ||
        simulation.output === null ||
        simulation.output === undefined
      ) {
        return null;
      }

      entries.push([simulationId, this.unwrapSimulationOutput(simulation.output)]);
    }

    return Object.fromEntries(entries);
  }

  private unwrapSimulationOutput(output: unknown): unknown {
    return output && typeof output === 'object' && 'result' in output ? output.result : output;
  }

  private async persistWithRetry(
    persistOnce: () => Promise<void>,
    targetType: string
  ): Promise<void> {
    try {
      await persistOnce();
    } catch (error) {
      console.error('[ResultPersister] Persistence failed, retrying once...', error);
      await this.sleep(1000);

      try {
        await persistOnce();
      } catch (retryError) {
        console.error('[ResultPersister] Retry failed', retryError);
        throw new Error(`Failed to persist ${targetType} after retry: ${retryError}`);
      }
    }
  }

  /**
   * Sleep helper for retry logic
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
