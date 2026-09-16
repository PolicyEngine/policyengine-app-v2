import { QueryClient } from '@tanstack/react-query';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import { markReportCompleted, markReportError } from '@/api/report';
import { markSimulationError, updateSimulationOutput } from '@/api/simulation';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import { householdCalculationError } from '@/utils/householdCalculationError';

/** Persists terminal calculations and reconciles their parent after durable writes. */
export class ResultPersister {
  private static parentWrites = new WeakMap<QueryClient, Map<string, Promise<void>>>();

  constructor(private queryClient: QueryClient) {}

  async persist(status: CalcStatus, countryId: string, year: string): Promise<void> {
    if (status.status !== 'error' && !status.result) {
      throw new Error('Cannot persist: result is missing from CalcStatus');
    }

    const write = async () => {
      if (status.metadata.targetType === 'report') {
        await this.persistToReport(status.metadata.calcId, status.result, countryId, year);
      } else {
        await this.persistToSimulation(status, countryId);
        if (status.metadata.reportId) {
          await this.reconcileParentReport(status.metadata.reportId, countryId);
        }
      }
    };

    try {
      await write();
    } catch (error) {
      console.error('[ResultPersister] Persistence failed, retrying once...', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await write();
      } catch (retryError) {
        console.error('[ResultPersister] Retry failed', retryError);
        throw new Error(
          `Failed to persist ${status.metadata.targetType} after retry: ${retryError}`
        );
      }
    }
  }

  private async persistToReport(
    reportId: string,
    result: CalcStatus['result'],
    countryId: string,
    year: string
  ): Promise<void> {
    const previous = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    const report: Report = {
      id: reportId,
      countryId: countryId as Report['countryId'],
      year,
      apiVersion: null,
      simulationIds: [],
      ...previous,
      status: 'complete',
      output: result as Report['output'],
    };
    await markReportCompleted(report.countryId, reportId, report);
    this.cacheReport(reportId, report);
  }

  private async persistToSimulation(status: CalcStatus, countryId: string): Promise<void> {
    const simulationId = status.metadata.calcId;
    const key = calculationKeys.bySimulationId(simulationId);
    // A parent PATCH retry must not write the same simulation again.
    if (this.queryClient.getQueryData<CalcStatus>(key)?.persisted) {
      return;
    }

    const metadata =
      status.status === 'error'
        ? await markSimulationError(
            countryId as Report['countryId'],
            simulationId,
            status.error?.message,
            status.error?.code
          )
        : await updateSimulationOutput(
            countryId as Report['countryId'],
            simulationId,
            status.result
          );

    this.queryClient.setQueryData<CalcStatus>(key, { ...status, persisted: true });
    if (metadata) {
      this.queryClient.setQueryData(
        simulationKeys.byId(simulationId),
        SimulationAdapter.fromMetadata(metadata)
      );
    }
    void this.queryClient.invalidateQueries({ queryKey: simulationKeys.byId(simulationId) });
  }

  /** Join parent writes so simultaneous siblings cannot overwrite a failure with success. */
  async reconcileParentReport(reportId: string, countryId: string): Promise<void> {
    let writes = ResultPersister.parentWrites.get(this.queryClient);
    if (!writes) {
      writes = new Map();
      ResultPersister.parentWrites.set(this.queryClient, writes);
    }
    const previous = writes.get(reportId) ?? Promise.resolve();
    const task = previous.catch(() => undefined).then(() => this.updateParent(reportId, countryId));
    writes.set(reportId, task);
    try {
      await task;
    } finally {
      if (writes.get(reportId) === task) {
        writes.delete(reportId);
      }
    }
  }

  private async updateParent(reportId: string, countryId: string): Promise<void> {
    const report = this.queryClient.getQueryData<Report>(reportKeys.byId(reportId));
    if (!report || report.status !== 'pending' || report.simulationIds.length === 0) {
      return;
    }

    const statuses = report.simulationIds.map((id) => this.durableSimulationStatus(id));
    const failure = statuses.find((status) => status?.status === 'error');
    if (failure) {
      const failedReport: Report = { ...report, status: 'error', outputType: 'household' };
      const error = failure.error;
      const message = error?.code ? `[${error.code}] ${error.message}` : error?.message;
      await markReportError(countryId as Report['countryId'], reportId, failedReport, message);
      this.cacheReport(reportId, failedReport);
    } else if (statuses.every((status) => status?.status === 'complete' && status.result)) {
      const completedReport: Report = {
        ...report,
        status: 'complete',
        outputType: 'household',
        output: Object.fromEntries(
          report.simulationIds.map((id, index) => [id, statuses[index]!.result])
        ) as Report['output'],
      };
      await markReportCompleted(countryId as Report['countryId'], reportId, completedReport);
      this.cacheReport(reportId, completedReport);
    }
  }

  private durableSimulationStatus(simulationId: string): CalcStatus | undefined {
    const calculation = this.queryClient.getQueryData<CalcStatus>(
      calculationKeys.bySimulationId(simulationId)
    );
    if (calculation?.persisted) {
      return calculation;
    }
    // Reopened reports may have siblings loaded from storage, without an active calculation.
    const simulation = this.queryClient.getQueryData<Simulation>(simulationKeys.byId(simulationId));
    if (!simulation || (simulation.status !== 'complete' && simulation.status !== 'error')) {
      return undefined;
    }
    return {
      status: simulation.status,
      persisted: true,
      result: simulation.output as CalcStatus['result'],
      error:
        simulation.status === 'error'
          ? householdCalculationError({ code: simulation.errorCode }, simulation.errorMessage)
          : undefined,
      metadata: {
        calcId: simulationId,
        calcType: 'household',
        targetType: 'simulation',
        startedAt: 0,
      },
    };
  }

  private cacheReport(reportId: string, report: Report): void {
    this.queryClient.setQueryData(reportKeys.byId(reportId), report);
    void this.queryClient.invalidateQueries({ queryKey: reportKeys.byId(reportId) });
  }
}
