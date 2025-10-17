import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import { ResultPersister } from './ResultPersister';
import type { CalcStartConfig, CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';

/**
 * Orchestrates calculation lifecycle
 * - Builds metadata and parameters from config
 * - Starts calculation query
 * - Watches for completion
 * - Auto-persists results when complete
 */
export class CalcOrchestrator {
  private currentUnsubscribe: (() => void) | null = null;

  constructor(
    private queryClient: QueryClient,
    private resultPersister: ResultPersister
  ) {}

  /**
   * Start a calculation and watch for completion
   * @param config - Configuration containing all necessary information
   */
  async startCalculation(config: CalcStartConfig): Promise<void> {
    const timestamp = Date.now();
    console.log(`[CalcOrchestrator][${timestamp}] ========================================`);
    console.log(`[CalcOrchestrator][${timestamp}] START: calcId="${config.calcId}" targetType="${config.targetType}"`);

    // Build metadata and params from config
    const metadata = this.buildMetadata(config);
    const params = this.buildParams(config);

    console.log(`[CalcOrchestrator][${timestamp}] Metadata:`, JSON.stringify(metadata, null, 2));
    console.log(`[CalcOrchestrator][${timestamp}] Params calcType:`, params.calcType);

    // Create query options based on target type
    // Register query defaults so useQuery can pick up the configuration
    if (config.targetType === 'report') {
      const queryOptions = calculationQueries.forReport(config.calcId, metadata, params);
      console.log(`[CalcOrchestrator][${timestamp}] Query key:`, JSON.stringify(queryOptions.queryKey));
      console.log(`[CalcOrchestrator][${timestamp}] Has queryFn?`, typeof queryOptions.queryFn === 'function');

      // Register the query defaults so any useQuery with this key gets the queryFn and refetch config
      this.queryClient.setQueryDefaults(queryOptions.queryKey, {
        queryFn: queryOptions.queryFn,
        refetchInterval: queryOptions.refetchInterval,
        staleTime: queryOptions.staleTime,
      // Use "as any" to bypass QueryOptions typing issues
      } as any);

      console.log(`[CalcOrchestrator][${timestamp}] BEFORE fetchQuery: ${Date.now()}`);
      await this.queryClient.fetchQuery(queryOptions);
      console.log(`[CalcOrchestrator][${timestamp}] AFTER fetchQuery: ${Date.now()}`);

      // Check if query was registered
      const queryState = this.queryClient.getQueryState(queryOptions.queryKey);
      console.log(`[CalcOrchestrator][${timestamp}] Query exists after prefetch?`, !!queryState);
      console.log(`[CalcOrchestrator][${timestamp}] Query status:`, queryState?.status);
      console.log(`[CalcOrchestrator][${timestamp}] Query fetchStatus:`, queryState?.fetchStatus);
    } else {
      const queryOptions = calculationQueries.forSimulation(config.calcId, metadata, params);
      console.log(`[CalcOrchestrator][${timestamp}] Query key:`, JSON.stringify(queryOptions.queryKey));
      console.log(`[CalcOrchestrator][${timestamp}] Has queryFn?`, typeof queryOptions.queryFn === 'function');

      // Register the query defaults so any useQuery with this key gets the queryFn and refetch config
      this.queryClient.setQueryDefaults(queryOptions.queryKey, {
        queryFn: queryOptions.queryFn,
        refetchInterval: queryOptions.refetchInterval,
        staleTime: queryOptions.staleTime,
      } as any);

      console.log(`[CalcOrchestrator][${timestamp}] BEFORE fetchQuery: ${Date.now()}`);
      await this.queryClient.fetchQuery(queryOptions);
      console.log(`[CalcOrchestrator][${timestamp}] AFTER fetchQuery: ${Date.now()}`);

      // Check if query was registered
      const queryState = this.queryClient.getQueryState(queryOptions.queryKey);
      console.log(`[CalcOrchestrator][${timestamp}] Query exists after prefetch?`, !!queryState);
      console.log(`[CalcOrchestrator][${timestamp}] Query status:`, queryState?.status);
      console.log(`[CalcOrchestrator][${timestamp}] Query fetchStatus:`, queryState?.fetchStatus);
    }

    // Log all queries in cache
    const allQueries = this.queryClient.getQueryCache().getAll();
    console.log(`[CalcOrchestrator][${timestamp}] Total queries in cache:`, allQueries.length);
    console.log(`[CalcOrchestrator][${timestamp}] All query keys:`, allQueries.map(q => JSON.stringify(q.queryKey)));

    // Subscribe to completion
    this.subscribeToCompletion(config.calcId, metadata, config.countryId);

    console.log(`[CalcOrchestrator][${timestamp}] END startCalculation`);
    console.log(`[CalcOrchestrator][${timestamp}] ========================================`);
  }

  /**
   * Subscribe to query updates and persist when complete
   */
  private subscribeToCompletion(
    calcId: string,
    metadata: CalcMetadata,
    countryId: string
  ): void {
    const queryKey =
      metadata.targetType === 'report'
        ? calculationQueries.forReport(calcId, metadata, {} as any).queryKey
        : calculationQueries.forSimulation(calcId, metadata, {} as any).queryKey;

    const observer = new QueryObserver(this.queryClient, {
      queryKey,
    });

    const unsubscribe = observer.subscribe((result) => {
      const status = result.data as CalcStatus | undefined;

      if (!status) {
        return;
      }

      console.log(
        `[CalcOrchestrator] Status update for ${calcId}: ${status.status} (progress: ${status.progress ?? 'N/A'}%)`
      );

      // Handle completion
      if (status.status === 'complete' && status.result) {
        console.log(`[CalcOrchestrator] Calculation complete, persisting result...`);
        this.resultPersister
          .persist(status, countryId)
          .then(() => {
            console.log(`[CalcOrchestrator] Result persisted successfully`);
          })
          .catch((error) => {
            console.error(`[CalcOrchestrator] Failed to persist result:`, error);
          })
          .finally(() => {
            unsubscribe();
            this.currentUnsubscribe = null;
          });
        return;
      }

      // Handle error
      if (status.status === 'error') {
        console.error(`[CalcOrchestrator] Calculation error:`, status.error);
        unsubscribe();
        this.currentUnsubscribe = null;
        return;
      }
    });

    // Store unsubscribe function for external cleanup
    this.currentUnsubscribe = unsubscribe;
  }

  /**
   * Clean up any active subscriptions
   * Call this when the orchestrator is no longer needed (e.g., component unmount)
   */
  cleanup(): void {
    if (this.currentUnsubscribe) {
      console.log('[CalcOrchestrator] Cleaning up active subscription');
      this.currentUnsubscribe();
      this.currentUnsubscribe = null;
    }
  }

  /**
   * Build CalcMetadata from config
   */
  private buildMetadata(config: CalcStartConfig): CalcMetadata {
    // Determine calcType from simulation populationType
    // 'geography' populationType -> 'economy' calcType
    // 'household' populationType -> 'household' calcType
    const populationType = config.simulations.simulation1.populationType || 'geography';
    const calcType = populationType === 'household' ? 'household' : 'economy';

    return {
      calcId: config.calcId,
      calcType,
      targetType: config.targetType,
      startedAt: Date.now(),
    };
  }

  /**
   * Build CalcParams from config
   * Extracts API parameters from simulations and populations
   */
  private buildParams(config: CalcStartConfig): CalcParams {
    const sim1 = config.simulations.simulation1;
    const sim2 = config.simulations.simulation2;

    // Determine which population to use
    let populationId: string;
    let region: string | undefined;

    const populationType = sim1.populationType || 'geography';

    if (populationType === 'household') {
      populationId = config.populations.household1?.id || sim1.populationId || '';
    } else {
      // Geography type
      const geography = config.populations.geography1;
      populationId = geography?.geographyId || sim1.populationId || config.countryId;
      region = geography?.geographyId || config.countryId;
    }

    // Map populationType to calcType
    const calcType = populationType === 'household' ? 'household' : 'economy';

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
