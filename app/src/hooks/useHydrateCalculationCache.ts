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
    const timestamp = Date.now();
    console.log(`[useHydrateCache][${timestamp}] ========================================`);
    console.log(`[useHydrateCache][${timestamp}] Effect triggered`);
    console.log(`[useHydrateCache][${timestamp}] report.id:`, report?.id);
    console.log(`[useHydrateCache][${timestamp}] report.output exists?`, !!report?.output);
    console.log(`[useHydrateCache][${timestamp}] outputType:`, outputType);
    console.log(`[useHydrateCache][${timestamp}] hydratedRef.current:`, hydratedRef.current);

    // Only hydrate once
    if (hydratedRef.current) {
      console.log(`[useHydrateCache][${timestamp}] SKIP: Already hydrated`);
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return;
    }

    if (!report?.output) {
      console.log(`[useHydrateCache][${timestamp}] SKIP: No report.output`);
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return;
    }

    if (!outputType) {
      console.log(`[useHydrateCache][${timestamp}] SKIP: No outputType`);
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return;
    }

    if (!report.id) {
      console.log(`[useHydrateCache][${timestamp}] SKIP: No report.id`);
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return;
    }

    hydratedRef.current = true;

    // Check if cache already has status (calculation might be running)
    const queryKey = calculationKeys.byReportId(report.id);
    const existing = queryClient.getQueryData<CalcStatus>(queryKey);

    console.log(`[useHydrateCache][${timestamp}] Query key:`, JSON.stringify(queryKey));
    console.log(`[useHydrateCache][${timestamp}] Existing cache entry?`, !!existing);
    console.log(`[useHydrateCache][${timestamp}] Existing status:`, existing?.status);

    if (existing) {
      console.log('[useHydrateCache] Cache already populated, skipping hydration');
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return; // Already in cache (might be computing)
    }

    console.log('[useHydrateCache] Hydrating cache with persisted result');

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

    console.log(`[useHydrateCache][${timestamp}] Setting cache with status:`, completeStatus.status);
    queryClient.setQueryData(queryKey, completeStatus);

    // Verify it was set
    const afterSet = queryClient.getQueryData<CalcStatus>(queryKey);
    console.log(`[useHydrateCache][${timestamp}] Cache entry exists after set?`, !!afterSet);
    console.log(`[useHydrateCache][${timestamp}] ========================================`);
  }, [report, outputType, queryClient]);
}
