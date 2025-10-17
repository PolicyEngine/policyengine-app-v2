import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import type { CalcStatus } from '@/types/calculation';
import { useAggregatedCalculationStatus, type AggregatedCalcStatus } from './useAggregatedCalculationStatus';
import { useSyntheticProgress } from './useSyntheticProgress';

/**
 * Internal hook to read single calculation status from cache
 * Subscribes to calculation query updates
 *
 * NOTE: This hook reads from queries started by CalcOrchestrator.
 * It reuses the existing query data without starting a new calculation.
 *
 * Enhances status with client-side synthetic progress for better UX:
 * - Household: Shows smooth progress during 30-45s API call
 * - Economy: Blends server progress with synthetic smoothing
 */
function useSingleCalculationStatus(calcId: string, targetType: 'report' | 'simulation') {
  const queryClient = useQueryClient();
  const queryKey =
    targetType === 'report'
      ? calculationKeys.byReportId(calcId)
      : calculationKeys.bySimulationId(calcId);

  const timestamp = Date.now();
  console.log(`[useCalculationStatus][${timestamp}] ========================================`);
  console.log(`[useCalculationStatus][${timestamp}] CALLED: calcId="${calcId}" targetType="${targetType}"`);
  console.log(`[useCalculationStatus][${timestamp}] Query key:`, JSON.stringify(queryKey));

  // Check if query exists BEFORE calling useQuery
  const queryState = queryClient.getQueryState(queryKey);
  const allQueries = queryClient.getQueryCache().getAll();

  console.log(`[useCalculationStatus][${timestamp}] Query exists in cache?`, !!queryState);
  console.log(`[useCalculationStatus][${timestamp}] Query status:`, queryState?.status);
  console.log(`[useCalculationStatus][${timestamp}] Query fetchStatus:`, queryState?.fetchStatus);
  console.log(`[useCalculationStatus][${timestamp}] Total queries in cache:`, allQueries.length);
  console.log(`[useCalculationStatus][${timestamp}] All query keys:`, allQueries.map(q => JSON.stringify(q.queryKey)));

  // Check specifically for calculation queries
  const calcQueries = allQueries.filter(q =>
    Array.isArray(q.queryKey) && q.queryKey[0] === 'calculations'
  );
  console.log(`[useCalculationStatus][${timestamp}] Calculation queries in cache:`, calcQueries.length);
  console.log(`[useCalculationStatus][${timestamp}] Calculation query keys:`, calcQueries.map(q => JSON.stringify(q.queryKey)));

  // IMPORTANT: queryFn and refetch config come from setQueryDefaults in CalcOrchestrator
  // This hook subscribes to the query and will pick up polling automatically
  const { data: status, isLoading } = useQuery<CalcStatus>({
    queryKey,
    enabled: !!calcId,
    // All other options (queryFn, refetchInterval, etc.) come from query defaults
  });

  console.log(`[useCalculationStatus][${timestamp}] useQuery returned - isLoading:`, isLoading);
  console.log(`[useCalculationStatus][${timestamp}] useQuery returned - status:`, status?.status);
  console.log(`[useCalculationStatus][${timestamp}] ========================================`);

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
