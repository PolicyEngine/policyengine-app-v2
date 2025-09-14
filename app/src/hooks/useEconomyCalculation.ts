import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import {
  fetchEconomyCalculation,
  EconomyReportOutput,
  EconomyCalculationParams,
  EconomyCalculationResponse
} from '@/api/economy';

// Google Cloud Workflow timeout (25 minutes in milliseconds)
const GC_WORKFLOW_TIMEOUT = 25 * 60 * 1000;

// Cache time for completed/errored calculations (10 minutes)
// After this time, they'll be garbage collected if not actively used
const COMPLETED_CACHE_TIME = 10 * 60 * 1000;

// Stale time for completed calculations (also 10 minutes)
// They won't refetch during this window
const COMPLETED_STALE_TIME = 10 * 60 * 1000;

// NOTE: This is set up to work with API v1; some of this logic will change after migrating
// to API v2, which should have more flexible calculation options.
interface UseEconomyCalculationOptions {
  countryId: string;
  reformPolicyId: string;
  baselinePolicyId: string;
  params?: EconomyCalculationParams;
  enabled?: boolean;
  onSuccess?: (data: EconomyReportOutput) => void;
  onError?: (error: Error) => void;
  onQueueUpdate?: (position: number, averageTime?: number) => void;
}

/**
 * Hook for managing economy-wide calculations with smart caching.
 *
 * Caching behavior:
 * - Pending calculations: Poll continuously every second
 * - Completed/Error calculations: Cache for 10 minutes, then garbage collect
 * - Multiple components can subscribe to the same calculation (deduplication)
 *
 * The calculation will continue running in the background even if you navigate
 * away, as long as at least one component is subscribed to it.
 */
export function useEconomyCalculation({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  params,
  enabled = true,
  onSuccess,
  onError,
  onQueueUpdate,
}: UseEconomyCalculationOptions) {
  const startTimeRef = useRef<number | null>(null);
  const lastHandledStatusRef = useRef<string | null>(null);
  const lastQueuePositionRef = useRef<number | undefined>(undefined);

  // Initialize start time when enabled
  if (enabled && !startTimeRef.current) {
    startTimeRef.current = Date.now();
  }

  // Create a wrapped query function that handles status evaluation
  const queryFnWithStatusHandling = useCallback(async () => {
    // Check for timeout before fetching
    if (startTimeRef.current && Date.now() - startTimeRef.current > GC_WORKFLOW_TIMEOUT) {
      const timeoutError = new Error('Economy calculation timed out after 25 minutes, the max length for a Google Cloud economy-wide simulation Workflow');
      onError?.(timeoutError);
      throw timeoutError;
    }

    const response = await fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId, params);

    // Handle the response based on status
    if (response.status === 'completed' && response.result) {
      // Only call onSuccess once per completion
      if (lastHandledStatusRef.current !== 'completed') {
        lastHandledStatusRef.current = 'completed';
        startTimeRef.current = null;
        onSuccess?.(response.result);
      }
    } else if (response.status === 'error') {
      // Only call onError once per error
      if (lastHandledStatusRef.current !== 'error') {
        lastHandledStatusRef.current = 'error';
        startTimeRef.current = null;
        onError?.(new Error(response.error || 'Calculation failed'));
      }
    } else if (response.status === 'pending') {
      // Handle queue updates
      if (response.queue_position !== undefined && response.queue_position !== lastQueuePositionRef.current) {
        lastQueuePositionRef.current = response.queue_position;
        onQueueUpdate?.(response.queue_position, response.average_time);
      }
    }

    return response;
  }, [countryId, reformPolicyId, baselinePolicyId, params, onSuccess, onError, onQueueUpdate]);

  const query = useQuery<EconomyCalculationResponse>({
    queryKey: ['economy', countryId, reformPolicyId, baselinePolicyId, params],
    queryFn: queryFnWithStatusHandling,
    enabled,
    // Set cache time based on the typical use case
    // Completed calculations remain valid for 10 minutes
    staleTime: COMPLETED_STALE_TIME,
    gcTime: COMPLETED_CACHE_TIME,
    // Handle network errors
    throwOnError: (error) => {
      // Call onError for network failures
      onError?.(error as Error);
      // Don't throw to React Error Boundary
      return false;
    },
    refetchInterval: (query) => {
      const data = query.state.data;

      // Check for timeout during polling
      if (startTimeRef.current && Date.now() - startTimeRef.current > GC_WORKFLOW_TIMEOUT) {
        // Stop polling on timeout - the next fetch will handle the error
        startTimeRef.current = null;
        return false;
      }

      // Continue polling only if status is pending
      return data?.status === 'pending' ? 1000 : false;
    },
  });

  // Provide a manual retry function that resets the state
  const retry = useCallback(() => {
    lastHandledStatusRef.current = null;
    lastQueuePositionRef.current = undefined;
    startTimeRef.current = Date.now();
    return query.refetch();
  }, [query]);

  return {
    ...query,
    retry,
    // Computed properties for convenience
    isPending: query.data?.status === 'pending',
    isCompleted: query.data?.status === 'completed',
    isErrored: query.data?.status === 'error',
    result: query.data?.result,
    queuePosition: query.data?.queue_position,
    calculationError: query.data?.error,
  };
}