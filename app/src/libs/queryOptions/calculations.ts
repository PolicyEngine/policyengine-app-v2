import { Query, QueryClient } from '@tanstack/react-query';
import { fetchReportById } from '@/api/report';
import { CalculationMeta } from '@/api/reportCalculations';
import { fetchSimulationById } from '@/api/simulation';
import { CalculationStatusResponse, getCalculationManager } from '@/libs/calculations';

/**
 * Get or reconstruct metadata for a calculation
 * @param reportId - The report ID
 * @param meta - Optional provided metadata
 * @param queryClient - Query client to check cache
 * @param countryId - Country ID for waterfall reconstruction
 */
async function getOrReconstructMetadata(
  reportId: string,
  meta?: CalculationMeta,
  queryClient?: QueryClient,
  countryId?: string
): Promise<CalculationMeta> {
  // Use provided metadata
  if (meta) {
    console.log(
      '[getOrReconstructMetadata] Using provided metadata:',
      JSON.stringify(meta, null, 2)
    );
    return meta;
  }

  // Check cache
  if (queryClient) {
    const metaKey = ['calculation-meta', reportId];
    const cached = queryClient.getQueryData<CalculationMeta>(metaKey);

    if (cached) {
      console.log(
        '[getOrReconstructMetadata] Using cached metadata:',
        JSON.stringify(cached, null, 2)
      );
      return cached;
    }
  }

  // Waterfall reconstruction
  if (!countryId) {
    throw new Error(`Country ID required for metadata reconstruction of report ${reportId}`);
  }

  console.log(
    '[getOrReconstructMetadata] Starting waterfall reconstruction for reportId:',
    reportId
  );

  try {
    // Step 1: Fetch report
    const report = await fetchReportById(countryId as any, reportId);
    console.log('[getOrReconstructMetadata] Report fetched:', report);

    // Step 2: Fetch simulations in parallel
    const [sim1, sim2] = await Promise.all([
      fetchSimulationById(report.country_id, report.simulation_1_id),
      report.simulation_2_id
        ? fetchSimulationById(report.country_id, report.simulation_2_id)
        : Promise.resolve(null),
    ]);
    console.log('[getOrReconstructMetadata] Simulations fetched:', { sim1, sim2 });

    // Step 3: Reconstruct metadata based on simulation type
    const reconstructedMeta: CalculationMeta = {
      type: sim1.population_type === 'household' ? 'household' : 'economy',
      countryId: report.country_id,
      policyIds: {
        baseline: String(sim1.policy_id),
        reform: sim2 ? String(sim2.policy_id) : undefined,
      },
      populationId: String(sim1.population_id),
      // For geography/economy, use population_id as region if subnational
      region:
        sim1.population_type === 'geography' && sim1.population_id !== report.country_id
          ? String(sim1.population_id)
          : undefined,
    };

    console.log(
      '[getOrReconstructMetadata] Reconstructed metadata:',
      JSON.stringify(reconstructedMeta, null, 2)
    );

    // Step 4: Cache reconstructed metadata for future use
    if (queryClient) {
      console.log('[getOrReconstructMetadata] Caching reconstructed metadata');
      queryClient.setQueryData(['calculation-meta', reportId], reconstructedMeta);
    }

    return reconstructedMeta;
  } catch (error) {
    console.error('[getOrReconstructMetadata] Waterfall reconstruction failed:', error);
    throw new Error(`Failed to reconstruct metadata for report ${reportId}: ${error}`);
  }
}

/**
 * Query options factory for report calculations
 * Provides canonical query configurations for TanStack Query
 */
export const calculationQueries = {
  /**
   * Query options for a report calculation
   * @param reportId - The report ID to fetch calculations for
   * @param meta - Optional metadata to avoid fetching report/simulation data
   * @param queryClient - Query client to check for cached metadata
   * @param countryId - Country ID for waterfall reconstruction if metadata is missing
   */
  forReport: (
    reportId: string,
    meta?: CalculationMeta,
    queryClient?: QueryClient,
    countryId?: string
  ) => {
    console.log('[calculationQueries.forReport] Called with:');
    console.log('  - reportId:', reportId, 'type:', typeof reportId);
    console.log('  - meta provided?', !!meta);
    console.log('  - meta:', meta ? JSON.stringify(meta, null, 2) : 'none');
    console.log('  - queryClient provided?', !!queryClient);

    return {
      queryKey: ['calculation', reportId] as const,
      queryFn: async () => {
        console.log('[calculationQueries.queryFn] Starting fetch for reportId:', reportId);

        // Require queryClient for manager
        if (!queryClient) {
          console.error('[calculationQueries.queryFn] No QueryClient provided');
          throw new Error('QueryClient is required for calculation queries');
        }

        // Get the calculation manager
        const manager = getCalculationManager(queryClient);
        console.log('[calculationQueries.queryFn] Got calculation manager');

        try {
          // Get or reconstruct metadata
          const calculationMeta = await getOrReconstructMetadata(
            reportId,
            meta,
            queryClient,
            countryId
          );
          console.log(
            '[calculationQueries.queryFn] Got metadata:',
            JSON.stringify(calculationMeta, null, 2)
          );

          // Start the calculation if needed and fetch the result
          console.log('[calculationQueries.queryFn] Starting calculation via manager');
          await manager.startCalculation(reportId, calculationMeta);

          console.log('[calculationQueries.queryFn] Fetching calculation via manager');
          const result = await manager.fetchCalculation(calculationMeta);
          console.log('[calculationQueries.queryFn] Manager returned result:', result);

          return result;
        } catch (error) {
          console.error('[calculationQueries.queryFn] Calculation failed:', error);
          throw error;
        }
      },
      refetchInterval: (query: Query<CalculationStatusResponse, Error>) => {
        console.log('[calculationQueries.refetchInterval] Checking if should refetch');
        const data = query.state.data;
        console.log('[calculationQueries.refetchInterval] Current data:', data);

        // Check if we have metadata to determine calculation type
        const queryKey = query.queryKey as readonly ['calculation', string];
        const reportId = queryKey[1];
        const metadataKey = ['calculation-meta', reportId] as const;
        const metadata = queryClient?.getQueryData<CalculationMeta>(metadataKey);

        console.log('[calculationQueries.refetchInterval] Metadata:', metadata);

        // Only poll for economy calculations with computing status
        // Household calculations use synthetic progress via cache updates, no polling needed
        if (data && typeof data === 'object' && 'status' in data) {
          console.log('[calculationQueries.refetchInterval] Data has status field:', data.status);

          if (data.status === 'computing') {
            // Check if this is a household calculation
            if (metadata?.type === 'household') {
              console.log(
                '[calculationQueries.refetchInterval] Household calculation - no polling needed (synthetic progress via cache)'
              );
              return false; // No polling for household calculations
            }

            // Economy calculation - poll the API
            console.log(
              '[calculationQueries.refetchInterval] Economy calculation - will refetch in 1000ms'
            );
            return 1000; // Poll every second for economy calculations
          }

          console.log('[calculationQueries.refetchInterval] Status is not computing, no refetch');
        } else {
          console.log(
            '[calculationQueries.refetchInterval] Data does not have status field or is not an object, no refetch'
          );
        }
        return false;
      },
      staleTime: Infinity, // Calculation results don't go stale
    };
  },

  /**
   * Invalidate a report calculation
   */
  invalidate: (reportId: string) => ({
    queryKey: ['calculation', reportId] as const,
  }),

  /**
   * Invalidate all calculations
   */
  invalidateAll: () => ({
    queryKey: ['calculation'] as const,
  }),
};
