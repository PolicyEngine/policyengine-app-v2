import { useQuery } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import { useAggregatedCalculationStatus, type AggregatedCalcStatus } from './useAggregatedCalculationStatus';
import { useSyntheticProgress } from './useSyntheticProgress';

/**
 * Internal hook to read single calculation status from cache
 * Does not fetch - only reads existing status from cache
 * Auto-subscribes to cache updates from background calculation queries
 *
 * Enhances status with client-side synthetic progress for better UX:
 * - Household: Shows smooth progress during 30-45s API call
 * - Economy: Blends server progress with synthetic smoothing
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

  // Determine calculation type from metadata
  const calcType = status?.metadata?.calcType || 'household';

  // Activate synthetic progress when:
  // - Query is loading (isPending for household - long-running API call)
  // - OR status is computing (for economy - queued/processing)
  const needsSyntheticProgress = isLoading || status?.status === 'computing';

  // Generate synthetic progress
  const synthetic = useSyntheticProgress(
    needsSyntheticProgress,
    calcType,
    {
      queuePosition: status?.queuePosition,
      estimatedTimeRemaining: status?.estimatedTimeRemaining,
    }
  );

  return {
    status: status?.status || 'idle',
    // Treat isPending as "computing" for UX purposes
    isComputing: status?.status === 'computing' || isLoading,
    isComplete: status?.status === 'complete',
    isError: status?.status === 'error',

    // Use synthetic progress when available, otherwise use server data
    progress: needsSyntheticProgress ? synthetic.progress : status?.progress,
    message: needsSyntheticProgress ? synthetic.message : status?.message,

    // Keep server data available
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
