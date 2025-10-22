import { useQueryClient, QueryObserver } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import { useAggregatedCalculationStatus, type AggregatedCalcStatus } from './useAggregatedCalculationStatus';
import { useSyntheticProgress } from './useSyntheticProgress';

/**
 * Internal hook to read single calculation status from cache
 * Subscribes to calculation query updates via QueryObserver
 *
 * NOTE: This hook subscribes to cache updates from CalcOrchestrator.
 * It does NOT poll the API - it only reacts to cache changes.
 *
 * HOW IT WORKS:
 * 1. CalcOrchestrator has a QueryObserver that polls the API and updates cache
 * 2. This hook has a QueryObserver that watches the cache for that same query key
 * 3. When CalcOrchestrator updates cache → this hook's observer fires → component re-renders
 * 4. No API polling here - just cache subscription
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

  // Initialize state with current cache value or initializing
  const [status, setStatus] = useState<CalcStatus | undefined>(() => {
    const cached = queryClient.getQueryData<CalcStatus>(queryKey);
    if (cached) {
      console.log(`[useCalculationStatus][${timestamp}] Initial cache hit:`, cached.status);
      return cached;
    }

    console.log(`[useCalculationStatus][${timestamp}] No initial cache, returning initializing`);
    return {
      status: 'initializing' as const,
      metadata: {
        calcId,
        targetType,
        calcType: 'societyWide' as const,
        startedAt: Date.now(),
      },
    };
  });

  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to cache updates via QueryObserver
  useEffect(() => {
    if (!calcId) return;

    console.log(`[useCalculationStatus] Creating QueryObserver for ${calcId}`);

    // Create observer that watches this query key
    const observer = new QueryObserver<CalcStatus>(queryClient, {
      queryKey,
    });

    // Subscribe to cache updates
    const unsubscribe = observer.subscribe((result) => {
      console.log(`[useCalculationStatus] Observer update for ${calcId}:`, result.data?.status);

      if (result.data) {
        setStatus(result.data);
      }
      setIsLoading(result.isLoading);
    });

    // Get current value immediately in case it was set while component was rendering
    const current = queryClient.getQueryData<CalcStatus>(queryKey);
    if (current) {
      console.log(`[useCalculationStatus] Immediate cache value for ${calcId}:`, current.status);
      setStatus(current);
    }

    return () => {
      console.log(`[useCalculationStatus] Unsubscribing observer for ${calcId}`);
      unsubscribe();
    };
  }, [queryClient, queryKey, calcId]);

  console.log(`[useCalculationStatus][${timestamp}] Current status:`, status?.status);
  console.log(`[useCalculationStatus][${timestamp}] ========================================`);

  // Determine calculation type from metadata
  const calcType = status?.metadata?.calcType || 'household';

  // Activate synthetic progress when:
  // - Query is loading (isPending for household - long-running API call)
  // - OR status is computing (for economy - queued/processing)
  const needsSyntheticProgress = isLoading || status?.status === 'pending';

  // Generate synthetic progress
  const synthetic = useSyntheticProgress(
    needsSyntheticProgress,
    calcType,
    {
      queuePosition: status?.queuePosition,
      estimatedTimeRemaining: status?.estimatedTimeRemaining,
    }
  );

  const currentStatus = status?.status || 'initializing';

  return {
    status: currentStatus,

    // State flags for common UI patterns
    isInitializing: currentStatus === 'initializing' || isLoading,
    isIdle: currentStatus === 'idle',
    isPending: currentStatus === 'pending' || isLoading,
    isComplete: currentStatus === 'complete',
    isError: currentStatus === 'error',

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
