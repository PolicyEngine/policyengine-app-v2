import { useQueries } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import { useSyntheticProgress } from './useSyntheticProgress';

/**
 * Aggregated status result for multiple calculations
 * Combines the status of N independent calculations into a single view
 */
export interface AggregatedCalcStatus {
  /**
   * Aggregated status:
   * - 'computing': if ANY calculation is computing
   * - 'complete': if ALL calculations are complete
   * - 'error': if ANY calculation has error
   * - 'idle': if all are idle or no calculations
   */
  status: 'idle' | 'computing' | 'complete' | 'error';

  /**
   * Individual calculation statuses
   */
  calculations: CalcStatus[];

  /**
   * Overall progress (average of all calculations)
   */
  progress?: number;

  /**
   * Whether any calculation is currently computing
   */
  isComputing: boolean;

  /**
   * Whether all calculations are complete
   */
  isComplete: boolean;

  /**
   * Whether any calculation has error
   */
  isError: boolean;

  /**
   * Error from first calculation that failed (if any)
   */
  error?: CalcStatus['error'];

  /**
   * Combined message from all calculations
   */
  message?: string;

  /**
   * Combined result from first complete calculation
   * For household reports with multiple simulations, this returns the first result
   */
  result?: any;

  /**
   * Queue position (from first computing calculation)
   */
  queuePosition?: number;

  /**
   * Estimated time remaining (from first computing calculation)
   */
  estimatedTimeRemaining?: number;

  /**
   * Whether data is loading (always false for aggregated - data comes from cache)
   */
  isLoading: boolean;
}

/**
 * Hook to aggregate calculation status from multiple simulations
 *
 * WHY: Household reports with N simulations need N independent calculations.
 * Each calculation has its own query at ['calculations', 'simulation', simId].
 * This hook reads all N queries and aggregates them into a single status view
 * for the UI to consume.
 *
 * @param calcIds - Array of calculation IDs to monitor
 * @param targetType - Type of calculations ('simulation' or 'report')
 * @returns Aggregated status across all calculations
 */
export function useAggregatedCalculationStatus(
  calcIds: string[],
  targetType: 'report' | 'simulation'
): AggregatedCalcStatus {
  // Read status from all calculation queries
  const results = useQueries({
    queries: calcIds.map((calcId) => ({
      queryKey:
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId),
      enabled: !!calcId,
      // Cache-only query - no queryFn
      // Data is populated by CalcOrchestrator/Strategies
      staleTime: Infinity,
    })),
  });

  // Extract all CalcStatus objects
  const calculations: CalcStatus[] = results
    .map((result) => result.data as CalcStatus | undefined)
    .filter((status): status is CalcStatus => status !== undefined);

  // Check if any queries are loading (for household calculations that are pending)
  const anyLoading = results.some((result) => result.isLoading);

  // Determine calculation type from first available metadata
  const calcType = calculations.length > 0
    ? calculations[0]?.metadata?.calcType || 'household'
    : 'household';

  // Activate synthetic progress when any query is loading or any status is computing
  const needsSyntheticProgress = anyLoading || calculations.some((calc) => calc.status === 'computing');

  // Generate synthetic progress
  const synthetic = useSyntheticProgress(
    needsSyntheticProgress,
    calcType,
    {
      queuePosition: calculations.find((calc) => calc.queuePosition)?.queuePosition,
      estimatedTimeRemaining: calculations.find((calc) => calc.estimatedTimeRemaining)?.estimatedTimeRemaining,
    }
  );

  // If no calculations loaded yet, but queries are loading, show computing with synthetic progress
  if (calculations.length === 0 && anyLoading) {
    return {
      status: 'computing',
      calculations: [],
      progress: synthetic.progress,
      message: synthetic.message,
      isComputing: true,
      isComplete: false,
      isError: false,
      isLoading: true,
    };
  }

  // If no calculations and not loading, return idle
  if (calculations.length === 0) {
    return {
      status: 'idle',
      calculations: [],
      isComputing: false,
      isComplete: false,
      isError: false,
      isLoading: false,
    };
  }

  // Check for any errors
  const hasError = calculations.some((calc) => calc.status === 'error');
  if (hasError) {
    const errorCalc = calculations.find((calc) => calc.status === 'error');
    return {
      status: 'error',
      calculations,
      isComputing: false,
      isComplete: false,
      isError: true,
      error: errorCalc?.error,
      isLoading: false,
    };
  }

  // Check if any are computing or loading
  const hasComputing = calculations.some((calc) => calc.status === 'computing') || anyLoading;
  if (hasComputing) {
    // Use synthetic progress when needed, otherwise calculate average from server data
    const progress = needsSyntheticProgress
      ? synthetic.progress
      : (() => {
          const progressValues = calculations
            .filter((calc) => calc.status === 'computing' && calc.progress !== undefined)
            .map((calc) => calc.progress!);
          return progressValues.length > 0
            ? progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length
            : undefined;
        })();

    // Use synthetic message when needed, otherwise combine server messages
    const message = needsSyntheticProgress
      ? synthetic.message
      : (() => {
          const messages = calculations
            .filter((calc) => calc.status === 'computing' && calc.message)
            .map((calc) => calc.message!);
          return messages.length > 0 ? messages.join('; ') : undefined;
        })();

    // Get queue position and estimated time from first computing calculation
    const firstComputing = calculations.find((calc) => calc.status === 'computing');

    return {
      status: 'computing',
      calculations,
      progress,
      isComputing: true,
      isComplete: false,
      isError: false,
      message,
      queuePosition: firstComputing?.queuePosition,
      estimatedTimeRemaining: firstComputing?.estimatedTimeRemaining,
      isLoading: anyLoading,
    };
  }

  // Check if all are complete
  const allComplete = calculations.every((calc) => calc.status === 'complete');
  if (allComplete) {
    // Get result from first complete calculation
    const firstComplete = calculations.find((calc) => calc.status === 'complete');

    return {
      status: 'complete',
      calculations,
      isComputing: false,
      isComplete: true,
      isError: false,
      result: firstComplete?.result,
      isLoading: false,
    };
  }

  // Default to idle (some might not have started yet)
  return {
    status: 'idle',
    calculations,
    isComputing: false,
    isComplete: false,
    isError: false,
    isLoading: false,
  };
}
