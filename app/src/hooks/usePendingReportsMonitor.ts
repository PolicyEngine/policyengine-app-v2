import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalculationStatusResponse } from '@/libs/calculations';
import { reportAssociationKeys, reportKeys } from '@/libs/queryKeys';
import { calculationQueries } from '@/libs/queryOptions/calculations';

/**
 * Hook to monitor pending reports and automatically refresh the reports list
 * when any pending report completes.
 *
 * This hook:
 * 1. Identifies all pending reports in the provided list
 * 2. Starts calculation queries for each (triggering polling)
 * 3. Subscribes to query cache updates
 * 4. Invalidates the reports list when any report transitions to complete/error
 *
 * @param reports - Array of report objects with status
 * @param countryId - Country ID for the calculation queries
 */
export function usePendingReportsMonitor(
  reports: Array<{ id?: string; status?: string }> | undefined,
  countryId: string
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!reports) {
      return;
    }

    // Extract IDs of all pending reports
    const pendingReportIds = reports
      .filter((report) => report.status === 'pending')
      .map((report) => report.id)
      .filter((id): id is string => !!id);

    if (pendingReportIds.length === 0) {
      return;
    }

    // Start calculation queries for all pending reports
    // This triggers the polling mechanism in calculationQueries
    pendingReportIds.forEach((reportId) => {
      queryClient.prefetchQuery(
        calculationQueries.forReport(reportId, undefined, queryClient, countryId)
      );
    });

    // Subscribe to query cache updates and invalidate reports list when any complete
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only handle updates to calculation queries for our pending reports
      // Query key is now ['calculation', reportId, 'v2']
      if (
        event.type === 'updated' &&
        event.query.queryKey[0] === 'calculation' &&
        pendingReportIds.includes(event.query.queryKey[1] as string)
      ) {
        const calculationData = event.query.state.data as CalculationStatusResponse | undefined;

        // If report transitioned to complete or error, refresh the reports list
        if (calculationData?.status === 'ok' || calculationData?.status === 'error') {
          console.log('[usePendingReportsMonitor] Report completed, refreshing reports list');
          queryClient.invalidateQueries({ queryKey: reportKeys.all });
          queryClient.invalidateQueries({ queryKey: reportAssociationKeys.all });
        }
      }
    });

    return unsubscribe;
  }, [reports, queryClient, countryId]);
}
