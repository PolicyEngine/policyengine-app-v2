import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalculationStatusResponse } from '@/libs/calculations';

/**
 * Hook to monitor a report's loading status and trigger callbacks
 * when the status changes (e.g., from pending to complete).
 *
 * This hook "hooks into" the report calculation query to determine
 * if it's loading or complete, enabling automatic UI updates.
 *
 * @param reportId - The report ID to monitor
 * @param onStatusChange - Callback when status changes
 * @returns Current loading status
 */
export function useReportLoadingStatus(
  reportId: string | undefined,
  onStatusChange?: (status: 'pending' | 'complete' | 'error') => void
): {
  isLoading: boolean;
  status: 'pending' | 'complete' | 'error' | 'unknown';
} {
  const queryClient = useQueryClient();

  // Get the current calculation data from the cache
  const calculationQuery = queryClient.getQueryState(['calculation', reportId]);
  const calculationData = calculationQuery?.data as CalculationStatusResponse | undefined;

  // Determine current status
  let status: 'pending' | 'complete' | 'error' | 'unknown' = 'unknown';
  let isLoading = false;

  // This status mapping is needed because the status values in this application
  // differ from those in API v1 endpoints. Ideally, v2 will improve/harmonize these.
  if (calculationData) {
    if (calculationData.status === 'computing') {
      status = 'pending';
      isLoading = true;
    } else if (calculationData.status === 'ok') {
      status = 'complete';
      isLoading = false;
    } else if (calculationData.status === 'error') {
      status = 'error';
      isLoading = false;
    }
  } else if (calculationQuery?.status === 'pending') {
    status = 'pending';
    isLoading = true;
  }

  // Subscribe to query changes to detect status transitions
  useEffect(() => {
    if (!reportId || !onStatusChange) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only listen to updates for this specific report's calculation query
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'calculation' &&
        event.query.queryKey[1] === reportId
      ) {
        const data = event.query.state.data as CalculationStatusResponse | undefined;

        if (data) {
          if (data.status === 'computing') {
            onStatusChange('pending');
          } else if (data.status === 'ok') {
            onStatusChange('complete');
          } else if (data.status === 'error') {
            onStatusChange('error');
          }
        }
      }
    });

    return unsubscribe;
  }, [reportId, onStatusChange, queryClient]);

  return { isLoading, status };
}
