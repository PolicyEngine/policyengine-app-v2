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
 * - For household: Await result (no polling)
 * - For economy: Start polling for progress
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
   * CRITICAL FLOW DIFFERENCE:
   *
   * HOUSEHOLD (synchronous):
   *   1. Execute queryFn() → BLOCKS for 30-45s
   *   2. Returns status='complete' immediately
   *   3. Set in cache
   *   4. Persist result
   *   5. Cleanup (no polling needed)
   *
   * ECONOMY (asynchronous):
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
    console.log(`[CalcOrchestrator][${timestamp}] ========================================`);
    console.log(`[CalcOrchestrator][${timestamp}] startCalculation() called`);
    console.log(`[CalcOrchestrator][${timestamp}]   calcId: "${config.calcId}"`);
    console.log(`[CalcOrchestrator][${timestamp}]   targetType: "${config.targetType}"`);
    console.log(`[CalcOrchestrator][${timestamp}]   countryId: "${config.countryId}"`);

    // Build metadata and params
    const metadata = this.buildMetadata(config);
    const params = this.buildParams(config);

    console.log(`[CalcOrchestrator][${timestamp}]   calcType: "${metadata.calcType}"`);
    console.log(`[CalcOrchestrator][${timestamp}]   populationId: "${params.populationId}"`);

    // Create query options (includes refetchInterval from strategy)
    const queryOptions =
      config.targetType === 'report'
        ? calculationQueries.forReport(config.calcId, metadata, params)
        : calculationQueries.forSimulation(config.calcId, metadata, params);

    console.log(
      `[CalcOrchestrator][${timestamp}]   queryKey:`,
      JSON.stringify(queryOptions.queryKey)
    );
    console.log(
      `[CalcOrchestrator][${timestamp}]   refetchInterval:`,
      queryOptions.refetchInterval
    );

    // For household calculations: Set 'computing' status BEFORE API call
    // WHY: Household API calls take 30-45s. By setting 'computing' status in cache
    // immediately, the UI can show synthetic progress during the long-running call.
    if (metadata.calcType === 'household') {
      console.log(
        `[CalcOrchestrator][${timestamp}] 🏠 HOUSEHOLD: Setting 'computing' status before API call...`
      );
      const computingStatus: CalcStatus = {
        status: 'pending',
        progress: 0,
        message: 'Initializing calculation...',
        metadata,
      };
      this.queryClient.setQueryData(queryOptions.queryKey, computingStatus);
      console.log(
        `[CalcOrchestrator][${timestamp}] ✓ Computing status cached, UI will show synthetic progress`
      );
    }

    // Execute initial queryFn
    console.log(`[CalcOrchestrator][${timestamp}] → Executing queryFn()...`);
    const startTime = Date.now();
    const initialStatus = await queryOptions.queryFn();
    const duration = Date.now() - startTime;
    console.log(`[CalcOrchestrator][${timestamp}] ✓ queryFn() completed in ${duration}ms`);
    console.log(`[CalcOrchestrator][${timestamp}]   Initial status: "${initialStatus.status}"`);

    // Set result in cache
    this.queryClient.setQueryData(queryOptions.queryKey, initialStatus);
    console.log(`[CalcOrchestrator][${timestamp}] ✓ Status cached`);

    // CRITICAL DECISION POINT: Household vs Economy
    if (initialStatus.status === 'complete') {
      // HOUSEHOLD CASE: Calculation completed synchronously
      console.log(
        `[CalcOrchestrator][${timestamp}] 🏠 HOUSEHOLD: Calculation completed immediately (no polling needed)`
      );
      console.log(`[CalcOrchestrator][${timestamp}]   Duration: ${duration}ms`);
      console.log(`[CalcOrchestrator][${timestamp}] → Persisting result...`);

      await this.resultPersister.persist(initialStatus, config.countryId);
      console.log(`[CalcOrchestrator][${timestamp}] ✓ Result persisted`);

      // Notify manager to cleanup this orchestrator
      if (this.manager) {
        console.log(`[CalcOrchestrator][${timestamp}] → Notifying manager to cleanup`);
        this.manager.cleanup(config.calcId);
      }

      console.log(`[CalcOrchestrator][${timestamp}] ✓ Household calculation complete`);
      console.log(`[CalcOrchestrator][${timestamp}] ========================================`);
      return;
    }

    // ECONOMY CASE: Start polling for progress
    console.log(
      `[CalcOrchestrator][${timestamp}] 🌍 ECONOMY: Starting polling (async calculation)`
    );
    this.startPolling(queryOptions, metadata, config.countryId, config.calcId);

    console.log(`[CalcOrchestrator][${timestamp}] ✓ Polling started`);
    console.log(`[CalcOrchestrator][${timestamp}] ========================================`);
  }

  /**
   * Start polling for calculation updates
   *
   * ⚠️  ONLY FOR ECONOMY CALCULATIONS
   * Household calculations never reach this method because they return 'complete' immediately.
   *
   * @param queryOptions - Query configuration with refetchInterval
   * @param metadata - Calculation metadata
   * @param countryId - Country ID for persistence
   * @param calcId - Calculation ID for cleanup
   */
  private startPolling(
    queryOptions: ReturnType<
      typeof calculationQueries.forReport | typeof calculationQueries.forSimulation
    >,
    metadata: CalcMetadata,
    countryId: string,
    calcId: string
  ): void {
    const { queryKey, queryFn, refetchInterval } = queryOptions;
    const timestamp = Date.now();

    console.log(`[CalcOrchestrator][${timestamp}] startPolling() called for ${calcId}`);
    console.log(`[CalcOrchestrator][${timestamp}]   refetchInterval: ${refetchInterval}`);

    // SAFETY CHECK: Should never happen since household returns 'complete' immediately
    if (refetchInterval === false) {
      console.error(
        `[CalcOrchestrator][${timestamp}] ❌ UNEXPECTED: startPolling() called with refetchInterval=false`
      );
      console.error(
        `[CalcOrchestrator][${timestamp}]    This should never happen! Household calculations should return 'complete' immediately.`
      );
      console.error(`[CalcOrchestrator][${timestamp}]    Cleaning up and returning.`);

      if (this.manager) {
        this.manager.cleanup(calcId);
      }
      return;
    }

    console.log(`[CalcOrchestrator][${timestamp}] ✓ Creating QueryObserver with polling`);

    // Create observer with polling
    const observer = new QueryObserver(this.queryClient, {
      queryKey,
      queryFn,
      refetchInterval: (typeof refetchInterval === 'function'
        ? refetchInterval
        : refetchInterval) as any, // Type assertion needed for QueryObserver
    });

    console.log(`[CalcOrchestrator][${timestamp}] ✓ Observer created, subscribing...`);

    // Subscribe to updates
    const unsubscribe = observer.subscribe((result) => {
      const status = result.data as CalcStatus | undefined;

      if (!status) {
        return;
      }

      const progress = status.progress !== undefined ? `${status.progress}%` : 'N/A';
      console.log(
        `[CalcOrchestrator] 🔄 Poll update for ${calcId}: status="${status.status}" progress=${progress}`
      );

      // Handle completion
      if (status.status === 'complete' && status.result) {
        const completionTime = Date.now();
        console.log(`[CalcOrchestrator][${completionTime}] ✅ COMPLETE: ${calcId}`);
        console.log(`[CalcOrchestrator][${completionTime}] → Persisting result...`);

        this.resultPersister
          .persist(status, countryId)
          .then(() => {
            console.log(`[CalcOrchestrator][${completionTime}] ✓ Result persisted for ${calcId}`);
          })
          .catch((error) => {
            console.error(
              `[CalcOrchestrator][${completionTime}] ❌ Failed to persist ${calcId}:`,
              error
            );
          })
          .finally(() => {
            console.log(`[CalcOrchestrator][${completionTime}] → Stopping polling and cleaning up`);
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
        console.error(`[CalcOrchestrator][${errorTime}] ❌ ERROR: ${calcId}`);
        console.error(`[CalcOrchestrator][${errorTime}]    Error:`, status.error);
        console.log(`[CalcOrchestrator][${errorTime}] → Stopping polling and cleaning up`);

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
    console.log(`[CalcOrchestrator][${timestamp}] ✓ Subscribed to polling updates`);
  }

  /**
   * Clean up active polling subscription
   * Called by manager when orchestrator is removed from registry
   */
  cleanup(): void {
    if (this.currentUnsubscribe) {
      console.log('[CalcOrchestrator] cleanup() → Stopping polling');
      this.currentUnsubscribe();
      this.currentUnsubscribe = null;
    } else {
      console.log('[CalcOrchestrator] cleanup() → No active polling to stop');
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
      populationId = geography?.geographyId || sim1.populationId || config.countryId;
      region = geography?.geographyId || config.countryId;
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
      calcId: config.calcId,
    };
  }
}
