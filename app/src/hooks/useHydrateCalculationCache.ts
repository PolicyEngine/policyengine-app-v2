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
    const currentReportId = report?.id || '';

    // Only hydrate once per report ID
    if (hydratedRef.current === currentReportId && currentReportId) {
      return;
    }

    if (!outputType || !currentReportId) {
      return;
    }

    // Mark this report as hydrated
    hydratedRef.current = currentReportId;

    // HOUSEHOLD vs ECONOMY: Different hydration strategies
    if (outputType === 'household') {
      // Read simulations from cache (already fetched by useUserReportById)
      const simulationIds = report?.simulationIds || [];
      const simulations = simulationIds
        .map((id) => queryClient.getQueryData<Simulation>(simulationKeys.byId(id)))
        .filter((s): s is Simulation => !!s);

      // Hydrate each simulation individually
      for (const simulation of simulations) {
        if (!simulation || !simulation.id) {
          continue;
        }

        // Check if calculation cache already has this simulation
        const calcQueryKey = calculationKeys.bySimulationId(simulation.id);
        const existing = queryClient.getQueryData<CalcStatus>(calcQueryKey);

        if (existing) {
          continue;
        }

        // Only hydrate if simulation has output and is complete
        if (simulation.output && simulation.status === 'complete') {
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
        }
      }
    } else {
      // SOCIETY-WIDE: Hydrate report-level cache (existing behavior)
      if (!report?.output) {
        return;
      }

      const queryKey = calculationKeys.byReportId(currentReportId);
      const existing = queryClient.getQueryData<CalcStatus>(queryKey);

      if (existing) {
        return;
      }

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
    }
  }, [report?.id, outputType, queryClient]);
}
