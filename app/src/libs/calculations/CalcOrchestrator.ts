import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import type { CalcMetadata, CalcParams, CalcStartConfig, CalcStatus } from '@/types/calculation';
import type { CalcOrchestratorManager } from './CalcOrchestratorManager';
import { ResultPersister } from './ResultPersister';

/**
 * Orchestrates a single calculation lifecycle
 *
 * RESPONSIBILITY:
 * - Execute calculation query
 * - Start polling for progress (both household and economy use async APIs)
 * - Persist result when complete
 * - Notify manager when done
 *
 * LIFECYCLE:
 * Created by CalcOrchestratorManager, cleaned up when calculation completes/errors
 */
export class CalcOrchestrator {
  private currentUnsubscribe: (() => void) | null = null;
  private queryClient: QueryClient;
  private resultPersister: ResultPersister;
  private manager: CalcOrchestratorManager | undefined;

  constructor(
    queryClient: QueryClient,
    resultPersister: ResultPersister,
    manager?: CalcOrchestratorManager // Optional for backwards compatibility during migration
  ) {
    this.queryClient = queryClient;
    this.resultPersister = resultPersister;
    this.manager = manager;
  }

  /**
   * Start a calculation
   *
   * UNIFIED ASYNC FLOW (both household and economy):
   *   1. Set initial 'pending' status in cache (for immediate UI feedback)
   *   2. Execute queryFn() → Creates job, returns 'pending' status
   *   3. Set result in cache
   *   4. Start polling (QueryObserver) every ~1s
   *   5. Poll until complete/error
   *   6. Persist result
   *   7. Cleanup
   *
   * Note: Both household (v2 alpha) and economy use async job-based APIs.
   * The strategy handles job creation and status polling internally.
   */
  async startCalculation(config: CalcStartConfig): Promise<void> {
    // Build metadata and params
    const metadata = this.buildMetadata(config);
    const params = this.buildParams(config);

    // Create query options (includes refetchInterval from strategy)
    const queryOptions =
      config.targetType === 'report'
        ? calculationQueries.forReport(config.calcId, metadata, params)
        : calculationQueries.forSimulation(config.calcId, metadata, params);

    // For household calculations: Set 'computing' status BEFORE API call
    // WHY: Household API calls take 30-45s. By setting 'computing' status in cache
    // immediately, the UI can show synthetic progress during the long-running call.
    if (metadata.calcType === 'household') {
      const computingStatus: CalcStatus = {
        status: 'pending',
        progress: 0,
        message: 'Initializing calculation...',
        metadata,
      };
      this.queryClient.setQueryData(queryOptions.queryKey, computingStatus);
    }

    // Execute initial queryFn
    const initialStatus = await queryOptions.queryFn();

    // Set result in cache
    this.queryClient.setQueryData(queryOptions.queryKey, initialStatus);

    // Check if calculation completed immediately (rare case)
    if (initialStatus.status === 'complete') {
      // Calculation completed synchronously (skip polling)
      await this.resultPersister.persist(initialStatus, config.countryId, config.year);

      // Notify manager to cleanup this orchestrator
      if (this.manager) {
        this.manager.cleanup(config.calcId);
      }

      return;
    }

    // Start polling for progress (both household and economy use async APIs)
    this.startPolling(queryOptions, metadata, config.countryId, config.calcId, config.year);
  }

  /**
   * Start polling for calculation updates
   *
   * Used by both household and economy calculations (both use async job APIs).
   *
   * @param queryOptions - Query configuration with refetchInterval
   * @param metadata - Calculation metadata
   * @param countryId - Country ID for persistence
   * @param calcId - Calculation ID for cleanup
   * @param year - Report year for persistence
   */
  private startPolling(
    queryOptions: ReturnType<
      typeof calculationQueries.forReport | typeof calculationQueries.forSimulation
    >,
    _metadata: CalcMetadata,
    countryId: string,
    calcId: string,
    year: string
  ): void {
    const { queryKey, queryFn, refetchInterval } = queryOptions;

    // SAFETY CHECK: Should never happen since both strategies now use polling
    if (refetchInterval === false) {
      console.error(
        '[CalcOrchestrator] Unexpected: startPolling() called with refetchInterval=false'
      );

      if (this.manager) {
        this.manager.cleanup(calcId);
      }
      return;
    }

    // Create observer with polling
    const observer = new QueryObserver(this.queryClient, {
      queryKey,
      queryFn,
      refetchInterval: (typeof refetchInterval === 'function'
        ? refetchInterval
        : refetchInterval) as any, // Type assertion needed for QueryObserver
    });

    // Subscribe to updates
    const unsubscribe = observer.subscribe((result) => {
      const status = result.data as CalcStatus | undefined;

      if (!status) {
        return;
      }

      // Handle completion
      if (status.status === 'complete' && status.result) {
        this.resultPersister
          .persist(status, countryId, year)
          .catch((error) => {
            console.error('[CalcOrchestrator] Failed to persist:', error);
          })
          .finally(() => {
            unsubscribe();
            this.currentUnsubscribe = null;

            // Notify manager to remove this orchestrator
            if (this.manager) {
              this.manager.cleanup(calcId);
            }
          });

        return;
      }

      // Handle error
      if (status.status === 'error') {
        console.error('[CalcOrchestrator] Calculation error:', status.error);

        unsubscribe();
        this.currentUnsubscribe = null;

        // Notify manager to remove this orchestrator
        if (this.manager) {
          this.manager.cleanup(calcId);
        }
      }
    });

    // Store unsubscribe function for manual cleanup
    this.currentUnsubscribe = unsubscribe;
  }

  /**
   * Clean up active polling subscription
   * Called by manager when orchestrator is removed from registry
   */
  cleanup(): void {
    if (this.currentUnsubscribe) {
      this.currentUnsubscribe();
      this.currentUnsubscribe = null;
    }
  }

  /**
   * Build CalcMetadata from config
   */
  private buildMetadata(config: CalcStartConfig): CalcMetadata {
    const populationType = config.simulations.simulation1.populationType || 'geography';
    const calcType = populationType === 'household' ? 'household' : 'societyWide';

    return {
      calcId: config.calcId,
      calcType,
      targetType: config.targetType,
      startedAt: Date.now(),
      reportId: config.reportId, // Pass through parent report ID for household sim-level calcs
    };
  }

  /**
   * Build CalcParams from config
   */
  private buildParams(config: CalcStartConfig): CalcParams {
    const sim1 = config.simulations.simulation1;
    const sim2 = config.simulations.simulation2;

    let populationId: string;
    let region: string | undefined;

    const populationType = sim1.populationType || 'geography';

    if (populationType === 'household') {
      populationId = config.populations.household1?.id || sim1.populationId || '';
    } else {
      const geography = config.populations.geography1;
      // regionCode contains the FULL prefixed value like "constituency/Sheffield Central"
      // For region parameter, prioritize: geography.regionCode → sim1.populationId → countryId
      // This ensures we use the stored populationId from the simulation if geography is not in config
      populationId = geography?.regionCode || sim1.populationId || config.countryId;
      region = geography?.regionCode || sim1.populationId || config.countryId;
    }

    const calcType = populationType === 'household' ? 'household' : 'societyWide';

    return {
      countryId: config.countryId as any,
      calcType,
      policyIds: {
        baseline: sim1.policyId || '',
        reform: sim2?.policyId,
      },
      populationId,
      region,
      year: config.year,
      calcId: config.calcId,
    };
  }
}
