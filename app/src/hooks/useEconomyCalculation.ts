import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';
import { updateReportStatus, updateReportOutput } from '@/reducers/reportReducer';
import {
  fetchEconomyCalculation,
  EconomyReportOutput,
  EconomyCalculationParams
} from '@/api/economy';

// Google Cloud Workflow timeout (25 minutes in milliseconds)
const GC_WORKFLOW_TIMEOUT = 25 * 60 * 1000;

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
  const dispatch = useDispatch();
  const startTimeRef = useRef<number | null>(null);

  // Track start time when query is enabled
  useEffect(() => {
    if (enabled && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, [enabled]);

  return useQuery({
    queryKey: ['economy', countryId, reformPolicyId, baselinePolicyId, params],
    queryFn: () => {
      // Check if we've exceeded the timeout
      if (startTimeRef.current && Date.now() - startTimeRef.current > GC_WORKFLOW_TIMEOUT) {
        throw new Error('Economy calculation timed out after 25 minutes, the max length for a Google Cloud economy-wide simulation Workflow');
      }
      return fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId, params);
    },
    enabled,
    refetchInterval: (data) => {
      // Check for timeout
      if (startTimeRef.current && Date.now() - startTimeRef.current > GC_WORKFLOW_TIMEOUT) {
        // Force error state for timeout
        dispatch(updateReportStatus('error'));
        onError?.(new Error('Economy calculation timed out after 25 minutes'));
        return false; // Stop polling
      }

      // Continue polling if status is pending
      if (data?.status === 'pending') {
        // Update queue position if available
        if (data.queue_position !== undefined) {
          onQueueUpdate?.(data.queue_position, data.average_time);
        }
        return 1000; // Poll every second
      }
      return false; // Stop polling
    },
    onSuccess: (data) => {
      // Reset start time on successful completion
      if (data.status === 'completed' && data.result) {
        startTimeRef.current = null;
        dispatch(updateReportStatus('complete'));
        dispatch(updateReportOutput(data.result));
        onSuccess?.(data.result);
      } else if (data.status === 'error') {
        startTimeRef.current = null;
        dispatch(updateReportStatus('error'));
        onError?.(new Error(data.error || 'Calculation failed'));
      }
    },
    onError: (error: Error) => {
      startTimeRef.current = null;
      dispatch(updateReportStatus('error'));
      onError?.(error);
    },
  });
}