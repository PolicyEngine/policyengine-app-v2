import { useQuery } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import { useAggregatedCalculationStatus, type AggregatedCalcStatus } from './useAggregatedCalculationStatus';

/**
 * Internal hook to read single calculation status from cache
 * Does not fetch - only reads existing status from cache
 * Auto-subscribes to cache updates from background calculation queries
 */
function useSingleCalculationStatus(calcId: string, targetType: 'report' | 'simulation') {
  const queryKey =
    targetType === 'report'
      ? calculationKeys.byReportId(calcId)
      : calculationKeys.bySimulationId(calcId);

  const { data: status, isLoading } = useQuery<CalcStatus>({
    queryKey,
    staleTime: Infinity,
    // No queryFn - this is a cache-only query
    // The query is populated by CalcOrchestrator via prefetchQuery
    enabled: !!calcId,
  });

  return {
    status: status?.status || 'idle',
    isComputing: status?.status === 'computing',
    isComplete: status?.status === 'complete',
    isError: status?.status === 'error',
    progress: status?.progress,
    message: status?.message,
    queuePosition: status?.queuePosition,
    estimatedTimeRemaining: status?.estimatedTimeRemaining,
    result: status?.result,
    error: status?.error,
    metadata: status?.metadata,
    isLoading,
  };
}

/**
 * Unified hook to read calculation status from cache
 *
 * Accepts either:
 * - Single calcId (string): Returns status for one calculation
 * - Multiple calcIds (string[]): Returns aggregated status across all calculations
 *
 * WHY: Household reports with N simulations need to aggregate N calculation statuses.
 * Economy reports need single calculation status. This hook encapsulates that logic
 * so consumers don't need to know which implementation to use.
 *
 * Does not fetch - only reads existing status from cache.
 * Auto-subscribes to cache updates from background calculation queries.
 *
 * @param calcId - Single calculation ID or array of calculation IDs
 * @param targetType - Whether calculations target 'report' or 'simulation'
 * @returns Status object (single or aggregated based on input)
 *
 * @example
 * // Single calculation (economy report)
 * const status = useCalculationStatus(reportId, 'report');
 *
 * @example
 * // Multiple calculations (household report with 3 simulations)
 * const status = useCalculationStatus([sim1.id, sim2.id, sim3.id], 'simulation');
 */
export function useCalculationStatus(
  calcId: string | string[],
  targetType: 'report' | 'simulation'
): ReturnType<typeof useSingleCalculationStatus> | AggregatedCalcStatus {
  const isArray = Array.isArray(calcId);

  // Call aggregated version for arrays
  const aggregated = useAggregatedCalculationStatus(
    isArray ? calcId : [],
    targetType
  );

  // Call single version for strings
  const single = useSingleCalculationStatus(
    !isArray ? calcId : '',
    targetType
  );

  return isArray ? aggregated : single;
}
