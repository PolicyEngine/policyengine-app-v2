import { QueryClient } from '@tanstack/react-query';
import {
  CalculationMeta,
  fetchCalculationWithMeta
} from '@/api/reportCalculations';

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
   */
  forReport: (
    reportId: string,
    meta?: CalculationMeta,
    queryClient?: QueryClient
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

      // If no metadata available, throw error
      // Metadata should always be set when report is created
      console.error('[calculationQueries.queryFn] No metadata found, throwing error');
      throw new Error(`No calculation metadata found for report ${reportId}`);
    },
    refetchInterval: (data: any) => {
      console.log('[calculationQueries.refetchInterval] Checking if should refetch');
      console.log('[calculationQueries.refetchInterval] Current data:', data);
      // Only poll if it's an economy calculation with pending status
      if (data && typeof data === 'object' && 'status' in data) {
        console.log('[calculationQueries.refetchInterval] Data has status field:', data.status);
        if (data.status === 'pending') {
          console.log('[calculationQueries.refetchInterval] Status is pending, will refetch in 1000ms');
          return 1000; // Poll every second
        }
        console.log('[calculationQueries.refetchInterval] Status is not pending, no refetch');
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