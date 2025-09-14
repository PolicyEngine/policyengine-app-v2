import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { EconomyCalculationResponse } from '@/api/economy';

interface CalculationSummary {
  countryId: string;
  reformPolicyId: string;
  baselinePolicyId: string;
  params: any;
  status: 'pending' | 'completed' | 'error' | 'loading';
  queuePosition?: number;
  averageTime?: number;
  result?: any;
  error?: string;
  lastUpdated?: number;
}

/**
 * Hook to access all cached economy calculations for the current user.
 * This provides a dashboard view of all ongoing, completed, and errored calculations.
 *
 * Calculations are automatically removed from this list after their cache expires
 * (10 minutes for completed/errored, 30 minutes for abandoned pending calculations).
 */
export function useUserEconomyCalculations() {
  const queryClient = useQueryClient();

  const calculations = useMemo(() => {
    // Get all queries that match the economy calculation pattern
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();

    const economyCalculations: CalculationSummary[] = [];

    allQueries.forEach((query) => {
      // Check if this is an economy calculation query
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === 'economy') {
        const [, countryId, reformPolicyId, baselinePolicyId, params] = queryKey;
        const state = query.state;

        // Extract calculation data
        const data = state.data as EconomyCalculationResponse | undefined;

        // Determine the effective status
        let status: CalculationSummary['status'] = 'loading';
        if (state.fetchStatus === 'fetching' && !data) {
          status = 'loading';
        } else if (data?.status === 'pending') {
          status = 'pending';
        } else if (data?.status === 'completed') {
          status = 'completed';
        } else if (data?.status === 'error' || state.error) {
          status = 'error';
        }

        economyCalculations.push({
          countryId: countryId as string,
          reformPolicyId: reformPolicyId as string,
          baselinePolicyId: baselinePolicyId as string,
          params,
          status,
          queuePosition: data?.queue_position,
          averageTime: data?.average_time,
          result: data?.result,
          error: data?.error || (state.error as Error)?.message,
          lastUpdated: state.dataUpdatedAt,
        });
      }
    });

    // Sort by last updated, most recent first
    return economyCalculations.sort((a, b) => {
      const timeA = a.lastUpdated || 0;
      const timeB = b.lastUpdated || 0;
      return timeB - timeA;
    });
  }, [queryClient]);

  // Helper functions
  const getPendingCalculations = () =>
    calculations.filter(calc => calc.status === 'pending');

  const getCompletedCalculations = () =>
    calculations.filter(calc => calc.status === 'completed');

  const getErroredCalculations = () =>
    calculations.filter(calc => calc.status === 'error');

  const getCalculationByIds = (
    countryId: string,
    reformPolicyId: string,
    baselinePolicyId: string,
    params?: any
  ) => {
    return calculations.find(
      calc =>
        calc.countryId === countryId &&
        calc.reformPolicyId === reformPolicyId &&
        calc.baselinePolicyId === baselinePolicyId &&
        JSON.stringify(calc.params) === JSON.stringify(params)
    );
  };

  // Function to manually invalidate a calculation (force refetch)
  const invalidateCalculation = (
    countryId: string,
    reformPolicyId: string,
    baselinePolicyId: string,
    params?: any
  ) => {
    queryClient.invalidateQueries({
      queryKey: ['economy', countryId, reformPolicyId, baselinePolicyId, params],
    });
  };

  // Function to remove a calculation from cache
  const removeCalculation = (
    countryId: string,
    reformPolicyId: string,
    baselinePolicyId: string,
    params?: any
  ) => {
    queryClient.removeQueries({
      queryKey: ['economy', countryId, reformPolicyId, baselinePolicyId, params],
    });
  };

  return {
    // All calculations
    calculations,

    // Filtered lists
    pendingCalculations: getPendingCalculations(),
    completedCalculations: getCompletedCalculations(),
    erroredCalculations: getErroredCalculations(),

    // Counts
    totalCount: calculations.length,
    pendingCount: getPendingCalculations().length,
    completedCount: getCompletedCalculations().length,
    erroredCount: getErroredCalculations().length,

    // Helper functions
    getCalculationByIds,
    invalidateCalculation,
    removeCalculation,
  };
}

/**
 * Hook to prefetch multiple economy calculations.
 * Useful for starting calculations in the background before the user navigates to them.
 */
export function usePrefetchEconomyCalculations() {
  const queryClient = useQueryClient();

  const prefetchCalculation = async (
    countryId: string,
    reformPolicyId: string,
    baselinePolicyId: string,
    params?: any
  ) => {
    await queryClient.prefetchQuery({
      queryKey: ['economy', countryId, reformPolicyId, baselinePolicyId, params],
      queryFn: () => {
        // This will be handled by the actual query when it runs
        // We're just warming up the cache
        return Promise.resolve({
          status: 'pending' as const,
          result: null,
        });
      },
    });
  };

  const prefetchMultiple = async (
    calculations: Array<{
      countryId: string;
      reformPolicyId: string;
      baselinePolicyId: string;
      params?: any;
    }>
  ) => {
    await Promise.all(
      calculations.map(calc =>
        prefetchCalculation(
          calc.countryId,
          calc.reformPolicyId,
          calc.baselinePolicyId,
          calc.params
        )
      )
    );
  };

  return {
    prefetchCalculation,
    prefetchMultiple,
  };
}