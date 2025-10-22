import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { calculationKeys, simulationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

interface UseHydrateCalculationCacheParams {
  /**
   * The report to hydrate from
   */
  report: Report | undefined;

  /**
   * The output type (determines calcType in metadata)
   */
  outputType: 'societyWide' | 'household' | undefined;
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
  const hydratedRef = useRef<string>(''); // Track which report we've hydrated

  useEffect(() => {
    const timestamp = Date.now();
    const currentReportId = report?.id || '';

    console.log(`[useHydrateCache][${timestamp}] ========================================`);
    console.log(`[useHydrateCache][${timestamp}] Effect triggered`);
    console.log(`[useHydrateCache][${timestamp}] report.id:`, currentReportId);
    console.log(`[useHydrateCache][${timestamp}] outputType:`, outputType);
    console.log(`[useHydrateCache][${timestamp}] hydratedRef:`, hydratedRef.current);

    // Only hydrate once per report ID
    if (hydratedRef.current === currentReportId && currentReportId) {
      console.log(`[useHydrateCache][${timestamp}] SKIP: Already hydrated report ${currentReportId}`);
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return;
    }

    if (!outputType || !currentReportId) {
      console.log(`[useHydrateCache][${timestamp}] SKIP: Missing outputType or report.id`);
      console.log(`[useHydrateCache][${timestamp}] ========================================`);
      return;
    }

    // Mark this report as hydrated
    hydratedRef.current = currentReportId;

    // HOUSEHOLD vs ECONOMY: Different hydration strategies
    if (outputType === 'household') {
      console.log('[useHydrateCache] HOUSEHOLD: Hydrating simulation-level caches');

      // Read simulations from cache (already fetched by useUserReportById)
      const simulationIds = report?.simulationIds || [];
      const simulations = simulationIds
        .map(id => queryClient.getQueryData<Simulation>(simulationKeys.byId(id)))
        .filter((s): s is Simulation => !!s);

      console.log(`[useHydrateCache][${timestamp}] Found ${simulations.length} simulations in cache`);

      // Hydrate each simulation individually
      for (const simulation of simulations) {
        if (!simulation || !simulation.id) continue;

        console.log(`[useHydrateCache][${timestamp}]   Simulation ${simulation.id}:`);
        console.log(`[useHydrateCache][${timestamp}]     status: ${simulation.status}`);
        console.log(`[useHydrateCache][${timestamp}]     Has output? ${!!simulation.output}`);

        // Check if calculation cache already has this simulation
        const calcQueryKey = calculationKeys.bySimulationId(simulation.id);
        const existing = queryClient.getQueryData<CalcStatus>(calcQueryKey);

        if (existing) {
          console.log(`[useHydrateCache][${timestamp}]     ⏭️  SKIP: Already in calculation cache (${existing.status})`);
          continue;
        }

        // Only hydrate if simulation has output and is complete
        if (simulation.output && simulation.status === 'complete') {
          console.log(`[useHydrateCache][${timestamp}]     → Hydrating calculation cache`);

          const completeStatus: CalcStatus = {
            status: 'complete',
            result: simulation.output as any,
            metadata: {
              calcId: simulation.id,
              calcType: 'household',
              targetType: 'simulation',
              startedAt: Date.now(),
              reportId: currentReportId,
            },
          };

          queryClient.setQueryData(calcQueryKey, completeStatus);
          console.log(`[useHydrateCache][${timestamp}]     ✓ Hydrated`);
        } else {
          console.log(`[useHydrateCache][${timestamp}]     ⏭️  SKIP: No output or not complete`);
        }
      }

      console.log(`[useHydrateCache][${timestamp}] ✓ Household simulation caches hydrated`);
    } else {
      // SOCIETY-WIDE: Hydrate report-level cache (existing behavior)
      console.log('[useHydrateCache] SOCIETY-WIDE: Hydrating report-level cache');

      if (!report?.output) {
        console.log(`[useHydrateCache][${timestamp}] SKIP: No report.output`);
        console.log(`[useHydrateCache][${timestamp}] ========================================`);
        return;
      }

      const queryKey = calculationKeys.byReportId(currentReportId);
      const existing = queryClient.getQueryData<CalcStatus>(queryKey);

      if (existing) {
        console.log(`[useHydrateCache][${timestamp}] SKIP: Already in cache (${existing.status})`);
        console.log(`[useHydrateCache][${timestamp}] ========================================`);
        return;
      }

      console.log('[useHydrateCache] Hydrating cache with persisted result');

      const completeStatus: CalcStatus = {
        status: 'complete',
        result: report.output as any,
        metadata: {
          calcId: currentReportId,
          calcType: 'societyWide',
          targetType: 'report',
          startedAt: Date.now(),
        },
      };

      queryClient.setQueryData(queryKey, completeStatus);
      console.log(`[useHydrateCache][${timestamp}] ✓ Hydrated`);
    }

    console.log(`[useHydrateCache][${timestamp}] ========================================`);
  }, [report?.id, outputType, queryClient]);
}
