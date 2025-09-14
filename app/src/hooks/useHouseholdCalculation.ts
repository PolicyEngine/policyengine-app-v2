import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { Household } from '@/types/ingredients/Household';

interface UseHouseholdCalculationOptions {
  countryId: string;
  householdId: string;
  policyId: string;
  enabled?: boolean;
  onSuccess?: (data: Household) => void;
  onError?: (error: Error) => void;
}

export function useHouseholdCalculation({
  countryId,
  householdId,
  policyId,
  enabled = true,
  onSuccess,
  onError,
}: UseHouseholdCalculationOptions) {
  const hasHandledSuccessRef = useRef(false);

  // Create a wrapped query function that handles callbacks
  const queryFnWithCallbacks = useCallback(async () => {
    const result = await fetchHouseholdCalculation(countryId, householdId, policyId);

    // Call onSuccess once per successful fetch
    if (!hasHandledSuccessRef.current && onSuccess) {
      hasHandledSuccessRef.current = true;
      onSuccess(result);
    }

    return result;
  }, [countryId, householdId, policyId, onSuccess]);

  const query = useQuery<Household>({
    queryKey: ['household_calculation', countryId, householdId, policyId],
    queryFn: queryFnWithCallbacks,
    enabled,
    // Cache for 10 minutes like economy calculations
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // No refetch interval needed - these are synchronous
    refetchInterval: false,
    // Handle network errors
    throwOnError: (error) => {
      // Call onError for failures
      onError?.(error as Error);
      // Don't throw to React Error Boundary
      return false;
    },
  });

  // Provide a manual retry function that resets the state
  const retry = useCallback(() => {
    hasHandledSuccessRef.current = false;
    return query.refetch();
  }, [query]);

  return {
    ...query,
    retry,
    household: query.data,
  };
}
