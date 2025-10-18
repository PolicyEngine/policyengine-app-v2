import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import { EconomyResultPersister } from './EconomyResultPersister';
import type { CalcStartConfig, CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import type { EconomyOrchestratorManager } from './EconomyOrchestratorManager';

/**
 * Orchestrates a single economy calculation lifecycle
 *
 * RESPONSIBILITY:
 * - Execute calculation query
 * - Start polling for progress (economy calculations are asynchronous)
 * - Persist result when complete
 * - Notify manager when done
 *
 * LIFECYCLE:
 * Created by EconomyOrchestratorManager, cleaned up when calculation completes/errors
 *
 * NOTE: This is economy-only. Household calculations use HouseholdReportOrchestrator.
 */
export class EconomyReportOrchestrator {
  private currentUnsubscribe: (() => void) | null = null;
  private queryClient: QueryClient;
  private resultPersister: EconomyResultPersister;
  private manager: EconomyOrchestratorManager | undefined;

  constructor(
    queryClient: QueryClient,
    resultPersister: EconomyResultPersister,
    manager?: EconomyOrchestratorManager
  ) {
    this.queryClient = queryClient;
    this.resultPersister = resultPersister;
    this.manager = manager;
  }

  /**
   * Start an economy calculation
   *
   * ECONOMY FLOW (asynchronous):
   *   1. Execute queryFn() → Returns immediately
   *   2. Returns status='computing'
   *   3. Set in cache
   *   4. Start polling (QueryObserver)
   *   5. Poll every 2s until complete
   *   6. Persist result
   *   7. Cleanup
   */
  async startCalculation(config: CalcStartConfig): Promise<void> {
    const timestamp = Date.now();
    console.log(`[EconomyReportOrchestrator][${timestamp}] ========================================`);
    console.log(`[EconomyReportOrchestrator][${timestamp}] startCalculation() called`);
    console.log(`[EconomyReportOrchestrator][${timestamp}]   calcId: "${config.calcId}"`);
    console.log(`[EconomyReportOrchestrator][${timestamp}]   targetType: "${config.targetType}"`);
    console.log(`[EconomyReportOrchestrator][${timestamp}]   countryId: "${config.countryId}"`);

    // Build metadata and params
    const metadata = this.buildMetadata(config);
    const params = this.buildParams(config);

    console.log(`[EconomyReportOrchestrator][${timestamp}]   calcType: "${metadata.calcType}"`);
    console.log(`[EconomyReportOrchestrator][${timestamp}]   populationId: "${params.populationId}"`);

    // Create query options (includes refetchInterval from strategy)
    const queryOptions = calculationQueries.forReport(config.calcId, metadata, params);

    console.log(`[EconomyReportOrchestrator][${timestamp}]   queryKey:`, JSON.stringify(queryOptions.queryKey));
    console.log(`[EconomyReportOrchestrator][${timestamp}]   refetchInterval:`, queryOptions.refetchInterval);

    // Execute initial queryFn
    console.log(`[EconomyReportOrchestrator][${timestamp}] → Executing queryFn()...`);
    const startTime = Date.now();
    const initialStatus = await queryOptions.queryFn();
    const duration = Date.now() - startTime;
    console.log(`[EconomyReportOrchestrator][${timestamp}] ✓ queryFn() completed in ${duration}ms`);
    console.log(`[EconomyReportOrchestrator][${timestamp}]   Initial status: "${initialStatus.status}"`);

    // Set result in cache
    this.queryClient.setQueryData(queryOptions.queryKey, initialStatus);
    console.log(`[EconomyReportOrchestrator][${timestamp}] ✓ Status cached`);

    // Start polling for progress
    console.log(`[EconomyReportOrchestrator][${timestamp}] 🌍 ECONOMY: Starting polling (async calculation)`);
    this.startPolling(queryOptions, metadata, config.countryId, config.calcId);

    console.log(`[EconomyReportOrchestrator][${timestamp}] ✓ Polling started`);
    console.log(`[EconomyReportOrchestrator][${timestamp}] ========================================`);
  }

  /**
   * Start polling for calculation updates
   *
   * @param queryOptions - Query configuration with refetchInterval
   * @param metadata - Calculation metadata
   * @param countryId - Country ID for persistence
   * @param calcId - Calculation ID for cleanup
   */
  private startPolling(
    queryOptions: ReturnType<typeof calculationQueries.forReport>,
    metadata: CalcMetadata,
    countryId: string,
    calcId: string
  ): void {
    const { queryKey, queryFn, refetchInterval } = queryOptions;
    const timestamp = Date.now();

    console.log(`[EconomyReportOrchestrator][${timestamp}] startPolling() called for ${calcId}`);
    console.log(`[EconomyReportOrchestrator][${timestamp}]   refetchInterval: ${refetchInterval}`);

    // Create observer with polling
    const observer = new QueryObserver(this.queryClient, {
      queryKey,
      queryFn,
      refetchInterval: (typeof refetchInterval === 'function'
        ? refetchInterval
        : refetchInterval) as any,
    });

    console.log(`[EconomyReportOrchestrator][${timestamp}] ✓ Observer created, subscribing...`);

    // Subscribe to updates
    const unsubscribe = observer.subscribe((result) => {
      const status = result.data as CalcStatus | undefined;

      if (!status) {
        return;
      }

      const progress = status.progress !== undefined ? `${status.progress}%` : 'N/A';
      console.log(`[EconomyReportOrchestrator] 🔄 Poll update for ${calcId}: status="${status.status}" progress=${progress}`);

      // Handle completion
      if (status.status === 'complete' && status.result) {
        const completionTime = Date.now();
        console.log(`[EconomyReportOrchestrator][${completionTime}] ✅ COMPLETE: ${calcId}`);
        console.log(`[EconomyReportOrchestrator][${completionTime}] → Persisting result...`);

        this.resultPersister
          .persist(status, countryId)
          .then(() => {
            console.log(`[EconomyReportOrchestrator][${completionTime}] ✓ Result persisted for ${calcId}`);
          })
          .catch((error) => {
            console.error(`[EconomyReportOrchestrator][${completionTime}] ❌ Failed to persist ${calcId}:`, error);
          })
          .finally(() => {
            console.log(`[EconomyReportOrchestrator][${completionTime}] → Stopping polling and cleaning up`);
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
        const errorTime = Date.now();
        console.error(`[EconomyReportOrchestrator][${errorTime}] ❌ ERROR: ${calcId}`);
        console.error(`[EconomyReportOrchestrator][${errorTime}]    Error:`, status.error);
        console.log(`[EconomyReportOrchestrator][${errorTime}] → Stopping polling and cleaning up`);

        unsubscribe();
        this.currentUnsubscribe = null;

        // Notify manager to remove this orchestrator
        if (this.manager) {
          this.manager.cleanup(calcId);
        }

        return;
      }
    });

    // Store unsubscribe function for manual cleanup
    this.currentUnsubscribe = unsubscribe;
    console.log(`[EconomyReportOrchestrator][${timestamp}] ✓ Subscribed to polling updates`);
  }

  /**
   * Clean up active polling subscription
   * Called by manager when orchestrator is removed from registry
   */
  cleanup(): void {
    if (this.currentUnsubscribe) {
      console.log('[EconomyReportOrchestrator] cleanup() → Stopping polling');
      this.currentUnsubscribe();
      this.currentUnsubscribe = null;
    } else {
      console.log('[EconomyReportOrchestrator] cleanup() → No active polling to stop');
    }
  }

  /**
   * Build CalcMetadata from config
   */
  private buildMetadata(config: CalcStartConfig): CalcMetadata {
    return {
      calcId: config.calcId,
      calcType: 'economy',
      targetType: config.targetType,
      startedAt: Date.now(),
    };
  }

  /**
   * Build CalcParams from config
   */
  private buildParams(config: CalcStartConfig): CalcParams {
    const sim1 = config.simulations.simulation1;
    const sim2 = config.simulations.simulation2;

    const geography = config.populations.geography1;
    const populationId = geography?.geographyId || sim1.populationId || config.countryId;
    const region = geography?.geographyId || config.countryId;

    return {
      countryId: config.countryId as any,
      calcType: 'economy',
      policyIds: {
        baseline: sim1.policyId || '',
        reform: sim2?.policyId,
      },
      populationId,
      region,
      calcId: config.calcId,
    };
  }
}
