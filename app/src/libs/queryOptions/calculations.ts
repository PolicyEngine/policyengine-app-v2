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
  ) => ({
    queryKey: ['calculation', reportId] as const,
    queryFn: async () => {
      // If metadata is provided, use it directly
      if (meta) {
        return fetchCalculationWithMeta(meta);
      }

      // Try to get metadata from cache
      if (queryClient) {
        const cachedMeta = queryClient.getQueryData<CalculationMeta>(
          ['calculation-meta', reportId]
        );
        if (cachedMeta) {
          return fetchCalculationWithMeta(cachedMeta);
        }
      }

      // If no metadata available, throw error
      // Metadata should always be set when report is created
      throw new Error(`No calculation metadata found for report ${reportId}`);
    },
    refetchInterval: (data: any) => {
      // Only poll if it's an economy calculation with pending status
      if (data && typeof data === 'object' && 'status' in data) {
        if (data.status === 'pending') {
          return 1000; // Poll every second
        }
      }
      return false;
    },
    staleTime: Infinity, // Calculation results don't go stale
  }),

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