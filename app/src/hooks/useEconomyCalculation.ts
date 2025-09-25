import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  EconomyCalculationParams,
  EconomyCalculationResponse,
  EconomyReportOutput,
  fetchEconomyCalculation,
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
  params: EconomyCalculationParams;
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
  console.log('[useEconomyCalculation] Called with:');
  console.log('  - countryId:', countryId);
  console.log('  - reformPolicyId:', reformPolicyId);
  console.log('  - baselinePolicyId:', baselinePolicyId);
  console.log('  - params:', JSON.stringify(params, null, 2));
  console.log('  - enabled:', enabled);

  const startTimeRef = useRef<number | null>(null);
  const lastHandledStatusRef = useRef<string | null>(null);
  const lastQueuePositionRef = useRef<number | undefined>(undefined);

  // Initialize start time when enabled
  if (enabled && !startTimeRef.current) {
    startTimeRef.current = Date.now();
    console.log('[useEconomyCalculation] Initialized start time:', startTimeRef.current);
  }

  // Create a wrapped query function that handles status evaluation
  const queryFnWithStatusHandling = useCallback(async () => {
    console.log('[useEconomyCalculation.queryFn] Starting fetch');
    // Check for timeout before fetching
    if (startTimeRef.current && Date.now() - startTimeRef.current > GC_WORKFLOW_TIMEOUT) {
      const timeoutError = new Error(
        'Economy calculation timed out after 25 minutes, the max length for a Google Cloud economy-wide simulation Workflow'
      );
      console.error('[useEconomyCalculation.queryFn] Timeout reached:', timeoutError);
      onError?.(timeoutError);
      throw timeoutError;
    }

    console.log('[useEconomyCalculation.queryFn] Calling fetchEconomyCalculation');
    const response = await fetchEconomyCalculation(
      countryId,
      reformPolicyId,
      baselinePolicyId,
      params
    );
    console.log('[useEconomyCalculation.queryFn] fetchEconomyCalculation response:');
    console.log('  - status:', response.status);
    console.log('  - has result?', !!response.result);
    console.log('  - queue_position:', response.queue_position);
    console.log('  - error:', response.error);

    // Handle the response based on status
    if (response.status === 'ok' && response.result) {
      console.log('[useEconomyCalculation.queryFn] Status is ok');
      // Only call onSuccess once per completion
      if (lastHandledStatusRef.current !== 'ok') {
        console.log('[useEconomyCalculation.queryFn] First time seeing ok, calling onSuccess');
        lastHandledStatusRef.current = 'ok';
        startTimeRef.current = null;
        onSuccess?.(response.result);
      } else {
        console.log('[useEconomyCalculation.queryFn] Already handled ok status');
      }
    } else if (response.status === 'error') {
      console.log('[useEconomyCalculation.queryFn] Status is error:', response.error);
      // Only call onError once per error
      if (lastHandledStatusRef.current !== 'error') {
        console.log('[useEconomyCalculation.queryFn] First time seeing error, calling onError');
        lastHandledStatusRef.current = 'error';
        startTimeRef.current = null;
        onError?.(new Error(response.error || 'Calculation failed'));
      } else {
        console.log('[useEconomyCalculation.queryFn] Already handled error status');
      }
    } else if (response.status === 'computing') {
      console.log('[useEconomyCalculation.queryFn] Status is computing');
      // Handle queue updates
      if (
        response.queue_position !== undefined &&
        response.queue_position !== lastQueuePositionRef.current
      ) {
        console.log(
          '[useEconomyCalculation.queryFn] Queue position changed:',
          lastQueuePositionRef.current,
          '->',
          response.queue_position
        );
        lastQueuePositionRef.current = response.queue_position;
        onQueueUpdate?.(response.queue_position, response.average_time);
      } else {
        console.log(
          '[useEconomyCalculation.queryFn] Queue position unchanged:',
          response.queue_position
        );
      }
    }

    return response;
  }, [countryId, reformPolicyId, baselinePolicyId, params, onSuccess, onError, onQueueUpdate]);

  const queryKey = ['economy', countryId, reformPolicyId, baselinePolicyId, params];
  console.log('[useEconomyCalculation] Query key:', JSON.stringify(queryKey));

  const query = useQuery<EconomyCalculationResponse>({
    queryKey,
    queryFn: queryFnWithStatusHandling,
    enabled,
    // Set cache time based on the typical use case
    // Completed calculations remain valid for 10 minutes
    staleTime: COMPLETED_STALE_TIME,
    gcTime: COMPLETED_CACHE_TIME,
    // Handle network errors
    throwOnError: (error) => {
      console.error('[useEconomyCalculation] Network error:', error);
      // Call onError for network failures
      onError?.(error as Error);
      // Don't throw to React Error Boundary
      return false;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      console.log('[useEconomyCalculation.refetchInterval] Checking refetch interval');
      console.log('  - current data:', data);
      console.log('  - data status:', data?.status);

      // Check for timeout during polling
      if (startTimeRef.current && Date.now() - startTimeRef.current > GC_WORKFLOW_TIMEOUT) {
        console.log('[useEconomyCalculation.refetchInterval] Timeout reached, stopping polling');
        // Stop polling on timeout - the next fetch will handle the error
        startTimeRef.current = null;
        return false;
      }

      // Continue polling only if status is computing
      const shouldRefetch = data?.status === 'computing' ? 1000 : false;
      console.log('[useEconomyCalculation.refetchInterval] Should refetch?', shouldRefetch);
      return shouldRefetch;
    },
  });

  console.log('[useEconomyCalculation] Query state:');
  console.log('  - isLoading:', query.isLoading);
  console.log('  - isError:', query.isError);
  console.log('  - data:', query.data);

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
    isPending: query.data?.status === 'computing',
    isComplete: query.data?.status === 'ok',
    isError: query.data?.status === 'error',
    result: query.data?.result,
    queuePosition: query.data?.queue_position,
    calculationError: query.data?.error,
  };
}
