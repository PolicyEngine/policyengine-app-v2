import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';

interface UseHydrateCalculationCacheParams {
  /**
   * The report to hydrate from
   */
  report: Report | undefined;

  /**
   * The output type (determines calcType in metadata)
   */
  outputType: 'economy' | 'household' | undefined;
}

/**
 * Hook to hydrate calculation cache from persisted report.output
 *
 * WHY THIS EXISTS:
 * When a user loads a report directly via URL, the query cache is empty.
 * If the report has already been calculated (report.output exists), we
 * populate the cache with the result to avoid re-running the calculation.
 *
 * This hook runs once on mount and populates the cache if:
 * 1. Report has output
 * 2. Cache doesn't already have the status
 *
 * IMPORTANT: This prevents unnecessary API calls and provides instant results
 * for completed reports when accessed via direct URL.
 *
 * @example
 * // In ReportOutput.page:
 * useHydrateCalculationCache({
 *   report,
 *   outputType,
 * });
 */
export function useHydrateCalculationCache({
  report,
  outputType,
}: UseHydrateCalculationCacheParams): void {
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);

  useEffect(() => {
    // Only hydrate once
    if (hydratedRef.current || !report?.output || !outputType || !report.id) {
      return;
    }

    hydratedRef.current = true;

    // Check if cache already has status (calculation might be running)
    const queryKey = calculationKeys.byReportId(report.id);
    const existing = queryClient.getQueryData<CalcStatus>(queryKey);

    if (existing) {
      console.log('[useHydrateCalculationCache] Cache already populated, skipping hydration');
      return; // Already in cache (might be computing)
    }

    console.log('[useHydrateCalculationCache] Hydrating cache with persisted result');

    // Report.output is already parsed (ReportOutput type), not JSON string
    // Populate cache with complete status from persisted output
    const completeStatus: CalcStatus = {
      status: 'complete',
      result: report.output as any, // Cast to any since CalcResult is a union type
      metadata: {
        calcId: report.id,
        calcType: outputType === 'household' ? 'household' : 'economy',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };

    queryClient.setQueryData(queryKey, completeStatus);
  }, [report, outputType, queryClient]);
}
