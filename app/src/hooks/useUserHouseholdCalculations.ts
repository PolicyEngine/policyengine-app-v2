import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Household } from '@/types/ingredients/Household';

interface HouseholdCalculationSummary {
  countryId: string;
  householdId: string;
  policyId: string;
  status: 'pending' | 'completed' | 'error';
  data?: Household;
  error?: string;
  lastUpdated?: number;
}

/**
 * Hook to access all cached household calculations for the current user.
 * This provides a dashboard view of all household calculations in the cache.
 *
 * Calculations are automatically removed from this list after their cache expires
 * (10 minutes as configured in useHouseholdCalculation).
 */
export function useUserHouseholdCalculations() {
  const queryClient = useQueryClient();

  const calculations = useMemo(() => {
    // Get all queries that match the household calculation pattern
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();

    const householdCalculations: HouseholdCalculationSummary[] = [];

    allQueries.forEach((query) => {
      // Check if this is a household calculation query
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === 'household_calculation') {
        const [, countryId, householdId, policyId] = queryKey;
        const state = query.state;

        // Extract calculation data
        const data = state.data as Household | undefined;

        // Map TanStack Query status to our three-state model
        // For household calculations (synchronous):
        // - 'idle' or 'pending/loading' means not started or fetching (maps to 'pending')
        // - 'success' means completed (maps to 'completed')
        // - 'error' means failed (maps to 'error')
        let status: HouseholdCalculationSummary['status'];
        if (state.status === 'success') {
          status = 'completed';
        } else if (state.status === 'error') {
          status = 'error';
        } else {
          // Both 'idle' and 'pending' (loading) map to 'pending'
          // This is because for synchronous operations, the loading state is very brief
          status = 'pending';
        }

        householdCalculations.push({
          countryId: countryId as string,
          householdId: householdId as string,
          policyId: policyId as string,
          status,
          data,
          error: state.error ? (state.error as Error).message : undefined,
          lastUpdated: state.dataUpdatedAt,
        });
      }
    });

    // Sort by last updated, most recent first
    return householdCalculations.sort((a, b) => {
      const timeA = a.lastUpdated || 0;
      const timeB = b.lastUpdated || 0;
      return timeB - timeA;
    });
  }, [queryClient]);

  // Helper functions
  const getCompletedCalculations = () => calculations.filter((calc) => calc.status === 'completed');

  const getPendingCalculations = () => calculations.filter((calc) => calc.status === 'pending');

  const getErroredCalculations = () => calculations.filter((calc) => calc.status === 'error');

  const getCalculationByIds = (
    countryId: string,
    householdId: string,
    policyId: string
  ) => {
    return calculations.find(
      (calc) =>
        calc.countryId === countryId &&
        calc.householdId === householdId &&
        calc.policyId === policyId
    );
  };

  // Function to manually invalidate a calculation (force refetch)
  const invalidateCalculation = (
    countryId: string,
    householdId: string,
    policyId: string
  ) => {
    queryClient.invalidateQueries({
      queryKey: ['household_calculation', countryId, householdId, policyId],
    });
  };

  // Function to remove a calculation from cache
  const removeCalculation = (
    countryId: string,
    householdId: string,
    policyId: string
  ) => {
    queryClient.removeQueries({
      queryKey: ['household_calculation', countryId, householdId, policyId],
    });
  };

  return {
    // All calculations
    calculations,

    // Filtered lists (matching economy calculations interface)
    pendingCalculations: getPendingCalculations(),
    completedCalculations: getCompletedCalculations(),
    erroredCalculations: getErroredCalculations(),

    // Counts (matching economy calculations interface)
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