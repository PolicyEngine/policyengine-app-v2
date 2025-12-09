import { useEffect, useState } from 'react';
import { QueryObserver, useQueryClient } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import { useSyntheticProgress } from './useSyntheticProgress';

/**
 * Aggregated status result for multiple calculations
 *
 * WHY THIS EXISTS: Household reports run N separate calculations (one per simulation).
 * For example, a report comparing 3 policies = 3 independent calculations.
 * This interface combines their statuses into a single view for the UI.
 *
 * AGGREGATION RULES:
 * - If ANY calc is in a "bad" state → overall is "bad" (error > computing > initializing)
 * - If ALL calcs are complete → overall is complete
 * - Otherwise → overall is idle
 */
export interface AggregatedCalcStatus {
  /**
   * Overall status across all calculations (prioritizes problems):
   *
   * - 'initializing': At least one calculation is still initializing (don't show "No output found" yet)
   * - 'pending': At least one calculation is running (show progress indicator)
   * - 'complete': ALL calculations finished successfully (show all results)
   * - 'error': At least one calculation failed (show error state)
   * - 'idle': All calculations have loaded their state and none have started (show "No output found")
   *
   * Example: [initializing, complete, complete] → 'initializing' (wait for first to load)
   * Example: [pending, complete, complete] → 'pending' (one still running)
   * Example: [complete, complete, complete] → 'complete' (all done)
   * Example: [idle, idle, idle] → 'idle' (none started)
   */
  status: 'initializing' | 'idle' | 'pending' | 'complete' | 'error';

  /**
   * Raw status objects for each individual calculation
   *
   * Example: For 3 simulations, this array has 3 CalcStatus objects.
   * Useful for showing per-simulation progress or debugging.
   */
  calculations: CalcStatus[];

  /**
   * Average progress across all computing calculations (0-100)
   *
   * Example: [50%, 75%, 100%] → 75% overall
   * Undefined if no calculations are reporting progress.
   */
  progress?: number;

  /**
   * True if ANY calculation doesn't know its state yet
   *
   * Use this to show "Loading..." instead of "No output found"
   * while waiting for cache hydration or initial data fetch.
   */
  isInitializing: boolean;

  /**
   * True if ALL calculations have confirmed they haven't started
   *
   * Only true after data loads and we KNOW nothing has been initiated.
   * Use this to show "No output found" or "Start calculation" button.
   */
  isIdle: boolean;

  /**
   * True if ANY calculation is currently running
   *
   * Use this to show progress indicators, disable "Start" button,
   * or prevent navigation away from the page.
   */
  isPending: boolean;

  /**
   * True if ALL calculations finished successfully
   *
   * Only true when every single calculation has completed.
   * Use this to show final results and enable export/sharing.
   */
  isComplete: boolean;

  /**
   * True if ANY calculation failed
   *
   * Use this to show error UI and offer retry option.
   */
  isError: boolean;

  /**
   * Error details from the first calculation that failed
   *
   * Contains error code, message, and whether retry is possible.
   * Undefined if no calculations have errored.
   */
  error?: CalcStatus['error'];

  /**
   * Human-readable status message (combined from all calculations)
   *
   * Example: "Processing simulation 1; Simulation 2 queued (position 3)"
   * Useful for showing detailed progress to users.
   */
  message?: string;

  /**
   * Result data from the first complete calculation
   *
   * NOTE: For household reports, each simulation has its own result.
   * This returns just the first one - access `calculations` array
   * directly if you need all results.
   */
  result?: any;

  /**
   * Queue position from the first queued calculation
   *
   * Example: If simulation 1 is at position 5 in queue, this is 5.
   * Undefined if no calculations are queued.
   */
  queuePosition?: number;

  /**
   * True if any underlying query is actively fetching data
   *
   * Usually false since calculations read from cache.
   * True during initial fetch or manual refetch.
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
 * NOTE: This hook subscribes to cache updates from CalcOrchestrator via QueryObserver.
 * It does NOT poll the API - it only reacts to cache changes.
 *
 * HOW IT WORKS:
 * 1. CalcOrchestrator has N QueryObservers that poll the API and update cache
 * 2. This hook has N QueryObservers that watch the cache for those same query keys
 * 3. When CalcOrchestrator updates cache → this hook's observers fire → component re-renders
 * 4. No API polling here - just cache subscription
 *
 * @param calcIds - Array of calculation IDs to monitor
 * @param targetType - Type of calculations ('simulation' or 'report')
 * @returns Aggregated status across all calculations
 */
export function useAggregatedCalculationStatus(
  calcIds: string[],
  targetType: 'report' | 'simulation'
): AggregatedCalcStatus {
  const queryClient = useQueryClient();

  // Initialize state with current cache values or initializing
  const [calculations, setCalculations] = useState<CalcStatus[]>(() => {
    return calcIds.map((calcId) => {
      const queryKey =
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId);

      const cached = queryClient.getQueryData<CalcStatus>(queryKey);
      if (cached) {
        return cached;
      }

      return {
        status: 'initializing' as const,
        metadata: {
          calcId,
          targetType,
          calcType: 'household' as const,
          startedAt: Date.now(),
        },
      };
    });
  });

  const [anyLoading, setAnyLoading] = useState(false);

  // Subscribe to cache updates for all calculations via QueryObserver
  useEffect(() => {
    if (calcIds.length === 0) {
      return;
    }

    // Create an observer for each calculation
    const observers = calcIds.map((calcId) => {
      const queryKey =
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId);

      return new QueryObserver<CalcStatus>(queryClient, {
        queryKey,
      });
    });

    // Subscribe to all observers
    const unsubscribers = observers.map((observer, index) => {
      return observer.subscribe((result) => {
        setCalculations((prev) => {
          const next = [...prev];
          if (result.data) {
            next[index] = result.data;
          }
          return next;
        });

        // Update anyLoading based on any observer's isLoading status
        setAnyLoading((prevLoading) => prevLoading || result.isLoading);
      });
    });

    // Get current values immediately in case they were set while component was rendering
    const currentValues = calcIds.map((calcId) => {
      const queryKey =
        targetType === 'report'
          ? calculationKeys.byReportId(calcId)
          : calculationKeys.bySimulationId(calcId);

      return queryClient.getQueryData<CalcStatus>(queryKey);
    });

    setCalculations((prev) => {
      return prev.map((calc, index) => currentValues[index] || calc);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, calcIds, targetType]);

  // Determine calculation type from first available metadata
  const calcType =
    calculations.length > 0 ? calculations[0]?.metadata?.calcType || 'household' : 'household';

  // Activate synthetic progress when any query is loading or any status is computing
  const needsSyntheticProgress =
    anyLoading || calculations.some((calc) => calc.status === 'pending');

  // Generate synthetic progress
  const synthetic = useSyntheticProgress(needsSyntheticProgress, calcType, {
    queuePosition: calculations.find((calc) => calc.queuePosition)?.queuePosition,
  });

  // Check if any are initializing
  const hasInitializing =
    calculations.some((calc) => calc.status === 'initializing') ||
    (calculations.length === 0 && anyLoading);

  if (hasInitializing) {
    return {
      status: 'initializing',
      calculations,
      isInitializing: true,
      isIdle: false,
      isPending: false,
      isComplete: false,
      isError: false,
      isLoading: anyLoading,
    };
  }

  // If no calculations and not loading, return idle
  if (calculations.length === 0) {
    return {
      status: 'idle',
      calculations: [],
      isInitializing: false,
      isIdle: true,
      isPending: false,
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
      isInitializing: false,
      isIdle: false,
      isPending: false,
      isComplete: false,
      isError: true,
      error: errorCalc?.error,
      isLoading: false,
    };
  }

  // Check if any are computing or loading
  const hasPending = calculations.some((calc) => calc.status === 'pending') || anyLoading;
  if (hasPending) {
    // Use synthetic progress when needed, otherwise calculate average from server data
    const progress = needsSyntheticProgress
      ? synthetic.progress
      : (() => {
          const progressValues = calculations
            .filter((calc) => calc.status === 'pending' && calc.progress !== undefined)
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
            .filter((calc) => calc.status === 'pending' && calc.message)
            .map((calc) => calc.message!);
          return messages.length > 0 ? messages.join('; ') : undefined;
        })();

    // Get queue position and estimated time from first computing calculation
    const firstComputing = calculations.find((calc) => calc.status === 'pending');

    return {
      status: 'pending',
      calculations,
      progress,
      isInitializing: false,
      isIdle: false,
      isPending: true,
      isComplete: false,
      isError: false,
      message,
      queuePosition: firstComputing?.queuePosition,
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
      isInitializing: false,
      isIdle: false,
      isPending: false,
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
    isInitializing: false,
    isIdle: true,
    isPending: false,
    isComplete: false,
    isError: false,
    isLoading: false,
  };
}
