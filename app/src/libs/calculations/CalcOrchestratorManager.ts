import { QueryClient } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import { CalcStartConfig, CalcStatus } from '@/types/calculation';
import { CalcOrchestrator } from './CalcOrchestrator';
import { ResultPersister } from './ResultPersister';

interface CalculationRegistry {
  orchestrators: Map<string, CalcOrchestrator>;
  tasks: Map<string, Promise<void>>;
}

/** One calculation owner per QueryClient, shared by builders and report output. */
export class CalcOrchestratorManager {
  private static registries = new WeakMap<QueryClient, CalculationRegistry>();
  private registry: CalculationRegistry;

  constructor(private queryClient: QueryClient) {
    let registry = CalcOrchestratorManager.registries.get(queryClient);
    if (!registry) {
      registry = { orchestrators: new Map(), tasks: new Map() };
      CalcOrchestratorManager.registries.set(queryClient, registry);
    }
    this.registry = registry;
  }

  async startCalculation(config: CalcStartConfig): Promise<void> {
    const { calcId, targetType } = config;
    const identity = `${targetType}:${calcId}`;
    const persister = new ResultPersister(this.queryClient);
    try {
      // Join the owner through the database write, including when another entry
      // point starts while the calculation response is already in the cache.
      const activeTask = this.registry.tasks.get(identity);
      if (activeTask) {
        await activeTask;
      } else if (!this.registry.orchestrators.has(identity)) {
        const key =
          config.targetType === 'simulation'
            ? calculationKeys.bySimulationId(calcId)
            : calculationKeys.byReportId(calcId);
        const cached = this.queryClient.getQueryData<CalcStatus>(key);
        if (!(cached?.persisted && (cached.status === 'complete' || cached.status === 'error'))) {
          const orchestrator = new CalcOrchestrator(this.queryClient, persister, this);
          this.registry.orchestrators.set(identity, orchestrator);
          // Register the promise before the calculation can complete synchronously.
          const task = Promise.resolve().then(() => orchestrator.startCalculation(config));
          this.registry.tasks.set(identity, task);
          try {
            await task;
          } finally {
            this.registry.tasks.delete(identity);
          }
        }
      }
      // A saved simulation can be shared by more than one report.
      if (config.reportId) {
        await persister.reconcileParentReport(config.reportId, config.countryId);
      }
    } catch (error) {
      console.error(`[CalcOrchestratorManager] Failed to start calculation ${calcId}:`, error);
      this.cleanup(calcId, targetType);
    }
  }

  isRunning(calcId: string, targetType?: CalcStartConfig['targetType']): boolean {
    const identities = targetType
      ? [`${targetType}:${calcId}`]
      : [`report:${calcId}`, `simulation:${calcId}`];
    return identities.some(
      (identity) => this.registry.orchestrators.has(identity) || this.registry.tasks.has(identity)
    );
  }

  cleanup(calcId: string, targetType?: CalcStartConfig['targetType']): void {
    const identities = targetType
      ? [`${targetType}:${calcId}`]
      : [`report:${calcId}`, `simulation:${calcId}`];
    for (const identity of identities) {
      this.registry.orchestrators.get(identity)?.cleanup();
      this.registry.orchestrators.delete(identity);
    }
  }

  cleanupAll(): void {
    for (const [calcId, orchestrator] of this.registry.orchestrators) {
      // An unmount cannot cancel a blocking household request or its PATCH.
      // Retain ownership until it settles, so a remount joins the same write.
      if (!this.registry.tasks.has(calcId)) {
        orchestrator.cleanup();
        this.registry.orchestrators.delete(calcId);
      }
    }
  }

  getDebugInfo(): { activeCount: number; activeIds: string[] } {
    const activeIds = Array.from(this.registry.orchestrators.keys(), (identity) =>
      identity.slice(identity.indexOf(':') + 1)
    );
    return { activeCount: activeIds.length, activeIds };
  }
}
