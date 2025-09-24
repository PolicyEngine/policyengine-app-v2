import { QueryClient, Query } from '@tanstack/react-query';
import {
  CalculationMeta,
  fetchCalculationWithMeta
} from '@/api/reportCalculations';
import { Household } from '@/types/ingredients/Household';
import { EconomyCalculationResponse } from '@/api/economy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';

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
      // If metadata is provided, use it directly
      if (meta) {
        console.log('[calculationQueries.queryFn] Using provided metadata:', JSON.stringify(meta, null, 2));
        try {
          const result = await fetchCalculationWithMeta(meta);
          console.log('[calculationQueries.queryFn] fetchCalculationWithMeta returned:', result);
          return result;
        } catch (error) {
          console.error('[calculationQueries.queryFn] fetchCalculationWithMeta failed:', error);
          throw error;
        }
      }

      // Try to get metadata from cache
      if (queryClient) {
        const metaKey = ['calculation-meta', reportId];
        console.log('[calculationQueries.queryFn] Looking for cached metadata with key:', metaKey);

        const cachedMeta = queryClient.getQueryData<CalculationMeta>(metaKey);
        console.log('[calculationQueries.queryFn] Found cached metadata?', !!cachedMeta);
        console.log('[calculationQueries.queryFn] Cached metadata:', cachedMeta ? JSON.stringify(cachedMeta, null, 2) : 'none');

        if (cachedMeta) {
          console.log('[calculationQueries.queryFn] Using cached metadata');
          try {
            const result = await fetchCalculationWithMeta(cachedMeta);
            console.log('[calculationQueries.queryFn] fetchCalculationWithMeta with cached meta returned:', result);
            return result;
          } catch (error) {
            console.error('[calculationQueries.queryFn] fetchCalculationWithMeta with cached meta failed:', error);
            throw error;
          }
        }
      } else {
        console.warn('[calculationQueries.queryFn] No queryClient provided, cannot look up cached metadata');
      }

      // If no metadata available, attempt waterfall reconstruction
      console.log('[calculationQueries.queryFn] No metadata found, starting waterfall reconstruction');

      // Require countryId for waterfall
      if (!countryId) {
        console.error('[calculationQueries.queryFn] No country ID provided for waterfall reconstruction');
        throw new Error(`Country ID required for metadata reconstruction of report ${reportId}`);
      }

      console.log('[calculationQueries.queryFn] Fetching report with countryId:', countryId, 'reportId:', reportId);

      try {
        // Step 1: Fetch report
        const report = await fetchReportById(countryId as any, reportId);
        console.log('[calculationQueries.queryFn] Report fetched:', report);

        // Step 2: Fetch simulations in parallel
        console.log('[calculationQueries.queryFn] Fetching simulations:', report.simulation_1_id, report.simulation_2_id);
        const [sim1, sim2] = await Promise.all([
          fetchSimulationById(report.country_id, report.simulation_1_id),
          report.simulation_2_id
            ? fetchSimulationById(report.country_id, report.simulation_2_id)
            : Promise.resolve(null)
        ]);
        console.log('[calculationQueries.queryFn] Simulations fetched:');
        console.log('  - sim1:', sim1);
        console.log('  - sim2:', sim2);

        // Step 3: Reconstruct metadata based on simulation type
        const reconstructedMeta: CalculationMeta = {
          type: sim1.population_type === 'household' ? 'household' : 'economy',
          countryId: report.country_id,
          policyIds: {
            baseline: String(sim1.policy_id),
            reform: sim2 ? String(sim2.policy_id) : undefined
          },
          populationId: String(sim1.population_id),
          // For geography/economy, use population_id as region if subnational
          region: sim1.population_type === 'geography' && sim1.population_id !== report.country_id
            ? String(sim1.population_id)
            : undefined
        };

        console.log('[calculationQueries.queryFn] Reconstructed metadata:', JSON.stringify(reconstructedMeta, null, 2));

        // Step 4: Cache reconstructed metadata for future use
        if (queryClient) {
          console.log('[calculationQueries.queryFn] Caching reconstructed metadata');
          queryClient.setQueryData(['calculation-meta', reportId], reconstructedMeta);
        }

        // Step 5: Fetch calculation with reconstructed metadata
        console.log('[calculationQueries.queryFn] Fetching calculation with reconstructed metadata');
        const result = await fetchCalculationWithMeta(reconstructedMeta);
        console.log('[calculationQueries.queryFn] Waterfall reconstruction complete, result:', result);
        return result;
      } catch (error) {
        console.error('[calculationQueries.queryFn] Waterfall reconstruction failed:', error);
        throw new Error(`Failed to reconstruct metadata for report ${reportId}: ${error}`);
      }
    },
    refetchInterval: (query: Query<Household | EconomyCalculationResponse, Error>) => {
      console.log('[calculationQueries.refetchInterval] Checking if should refetch');
      console.log('[calculationQueries.refetchInterval] Query state:', query.state);
      const data = query.state.data;
      console.log('[calculationQueries.refetchInterval] Current data:', data);

      // Only poll if it's an economy calculation with computing status
      if (data && typeof data === 'object' && 'status' in data) {
        console.log('[calculationQueries.refetchInterval] Data has status field:', data.status);
        if (data.status === 'computing') {
          console.log('[calculationQueries.refetchInterval] Status is computing, will refetch in 1000ms');
          return 1000; // Poll every second
        }
        console.log('[calculationQueries.refetchInterval] Status is not computing, no refetch');
      } else {
        console.log('[calculationQueries.refetchInterval] Data does not have status field or is not an object, no refetch');
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