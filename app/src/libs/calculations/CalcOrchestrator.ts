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
  constructor(
    private queryClient: QueryClient,
    private resultPersister: ResultPersister
  ) {}

  /**
   * Start a calculation and watch for completion
   * @param config - Configuration containing all necessary information
   */
  async startCalculation(config: CalcStartConfig): Promise<void> {
    console.log(`[CalcOrchestrator] Starting calculation for: ${config.calcId}`);

    // Build metadata and params from config
    const metadata = this.buildMetadata(config);
    const params = this.buildParams(config);

    // Create query options based on target type
    // Start the query (this will trigger the calculation)
    if (config.targetType === 'report') {
      const queryOptions = calculationQueries.forReport(config.calcId, metadata, params);
      this.queryClient.prefetchQuery(queryOptions);
    } else {
      const queryOptions = calculationQueries.forSimulation(config.calcId, metadata, params);
      this.queryClient.prefetchQuery(queryOptions);
    }

    // Subscribe to completion
    this.subscribeToCompletion(config.calcId, metadata, config.countryId);
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
          });
      }

      // Handle error
      if (status.status === 'error') {
        console.error(`[CalcOrchestrator] Calculation error:`, status.error);
        unsubscribe();
      }
    });
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
    };
  }
}
