import { Query, QueryClient } from '@tanstack/react-query';
import { convertJsonToReportOutput } from '@/adapters/conversionHelpers';
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
    return meta;
  }

  // Check cache
  if (queryClient) {
    const metaKey = ['calculation-meta', reportId];
    const cached = queryClient.getQueryData<CalculationMeta>(metaKey);

    if (cached) {
      return cached;
    }
  }

  // Waterfall reconstruction
  if (!countryId) {
    throw new Error(`Country ID required for metadata reconstruction of report ${reportId}`);
  }

  try {
    // Step 1: Fetch report
    const report = await fetchReportById(countryId as any, reportId);

    // Step 2: Fetch simulations in parallel
    const [sim1, sim2] = await Promise.all([
      fetchSimulationById(report.country_id, report.simulation_1_id),
      report.simulation_2_id
        ? fetchSimulationById(report.country_id, report.simulation_2_id)
        : Promise.resolve(null),
    ]);

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

    // Step 4: Cache reconstructed metadata for future use
    if (queryClient) {
      queryClient.setQueryData(['calculation-meta', reportId], reconstructedMeta);
    }

    return reconstructedMeta;
  } catch (error) {
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
    return {
      queryKey: ['calculation', reportId, 'v2'] as const, // Added v2 to force cache invalidation
      queryFn: async () => {
        // Require queryClient for manager
        if (!queryClient) {
          throw new Error('QueryClient is required for calculation queries');
        }

        try {
          // Step 1: Always fetch the Report first to check its status
          const reportMetadata = await fetchReportById(countryId as any, reportId);

          // Step 2: If report is complete, return its output directly (single source of truth)
          if (reportMetadata.status === 'complete' && reportMetadata.output) {
            // Still need to reconstruct and cache metadata so useReportData knows the output type
            await getOrReconstructMetadata(reportId, meta, queryClient, countryId);

            // Parse the JSON-stringified output from the API
            const parsedOutput = convertJsonToReportOutput(reportMetadata.output);
            return {
              status: 'ok' as const,
              result: parsedOutput,
            };
          }

          // Step 3: If report errored, return error status
          if (reportMetadata.status === 'error') {
            return {
              status: 'error' as const,
              result: null,
              error: 'Report calculation failed',
            };
          }

          // Step 4: Report is pending - get metadata and call calculation endpoint
          const manager = getCalculationManager(queryClient);

          // Get or reconstruct metadata
          const calculationMeta = await getOrReconstructMetadata(
            reportId,
            meta,
            queryClient,
            countryId
          );

          // For household calculations, ensure progress updates are started
          if (calculationMeta.type === 'household') {
            await manager.startCalculation(reportId, calculationMeta);
          }

          const result = await manager.fetchCalculation(reportId, calculationMeta);
          return result;
        } catch (error) {
          throw error;
        }
      },
      refetchInterval: (query: Query<CalculationStatusResponse, Error>) => {
        const data = query.state.data;

        // Check if we have metadata to determine calculation type
        const queryKey = query.queryKey as readonly ['calculation', string, string];
        const reportId = queryKey[1];
        const metadataKey = ['calculation-meta', reportId] as const;
        const metadata = queryClient?.getQueryData<CalculationMeta>(metadataKey);

        // Only poll for economy calculations with computing status
        // Household calculations use synthetic progress via cache updates, no polling needed
        if (data && typeof data === 'object' && 'status' in data) {
          if (data.status === 'computing') {
            // Check if this is a household calculation
            if (metadata?.type === 'household') {
              return false; // No polling for household calculations
            }

            // Economy calculation - poll the API
            return 1000; // Poll every second for economy calculations
          }
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
