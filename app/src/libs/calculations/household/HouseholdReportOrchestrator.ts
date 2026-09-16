import type { QueryClient } from '@tanstack/react-query';
import { calculationKeys, reportKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { HouseholdReportConfig } from '@/types/calculation/household';
import { CalcOrchestratorManager } from '../CalcOrchestratorManager';
import { HouseholdProgressCoordinator } from './HouseholdProgressCoordinator';

/** Report-output entry point to the same calculation/persistence owner used by builders. */
export class HouseholdReportOrchestrator {
  private static instances = new WeakMap<QueryClient, HouseholdReportOrchestrator>();
  private manager: CalcOrchestratorManager;
  private reports = new Map<string, Promise<void>>();

  private constructor(private queryClient: QueryClient) {
    this.manager = new CalcOrchestratorManager(queryClient);
  }

  static getInstance(queryClient: QueryClient): HouseholdReportOrchestrator {
    let instance = this.instances.get(queryClient);
    if (!instance) {
      instance = new HouseholdReportOrchestrator(queryClient);
      this.instances.set(queryClient, instance);
    }
    return instance;
  }

  async startReport(config: HouseholdReportConfig): Promise<void> {
    const active = this.reports.get(config.reportId);
    if (active) {
      return active;
    }
    // Stale pending props must not replace the parent's saved terminal status.
    if (!this.queryClient.getQueryData(reportKeys.byId(config.reportId))) {
      this.queryClient.setQueryData(reportKeys.byId(config.reportId), config.report);
    }
    const task = this.calculateReport(config);
    this.reports.set(config.reportId, task);
    try {
      await task;
    } finally {
      this.reports.delete(config.reportId);
    }
  }

  private async calculateReport(config: HouseholdReportConfig): Promise<void> {
    const { reportId, countryId, simulationConfigs, report } = config;
    const progress = new HouseholdProgressCoordinator(
      this.queryClient,
      reportId,
      simulationConfigs.map((simulation) => simulation.simulationId)
    );
    const timer = progress.startProgressTimer();
    try {
      await Promise.all(
        simulationConfigs.map(async ({ simulationId, populationId, policyId }) => {
          progress.startSimulation(simulationId);
          await this.manager.startCalculation({
            calcId: simulationId,
            targetType: 'simulation',
            reportId,
            countryId,
            year: report.year,
            simulations: {
              simulation1: {
                id: simulationId,
                populationId,
                policyId,
                populationType: 'household',
                label: null,
                isCreated: true,
              },
            },
            populations: {},
          });
          const status = this.queryClient.getQueryData<CalcStatus>(
            calculationKeys.bySimulationId(simulationId)
          );
          if (status?.status === 'complete') {
            progress.completeSimulation(simulationId);
          } else {
            progress.failSimulation(simulationId);
          }
        })
      );
    } finally {
      progress.cleanup(timer);
    }
  }

  isCalculating(simulationId: string): boolean {
    return this.manager.isRunning(simulationId, 'simulation');
  }
}
