import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Hook to get progress across multiple simulations
 * Reads from simulation CalcStatus cache (no separate progress tracking)
 *
 * SIMPLIFIED ARCHITECTURE:
 * - No HouseholdReportProgress
 * - Reads directly from simulation CalcStatus
 * - Pure derived state from cache
 */
export function useSimulationProgress(simulationIds: string[]) {
  // Subscribe to all simulation statuses
  const queries = useQueries({
    queries: simulationIds.map((simId) => ({
      queryKey: calculationKeys.bySimulationId(simId),
      enabled: !!simId,
      staleTime: Infinity, // CalcStatus doesn't go stale
    })),
  });

  const statuses = queries.map((q) => q.data as CalcStatus | undefined);

  // Calculate derived state
  const { overallProgress, isPending, isComplete, isError } = useMemo(() => {
    const validStatuses = statuses.filter((s): s is CalcStatus => !!s);

    if (validStatuses.length === 0) {
      return {
        overallProgress: 0,
        isPending: false,
        isComplete: false,
        isError: false,
      };
    }

    const progresses = validStatuses.map((s) => s.progress || 0);
    const overall = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;

    return {
      overallProgress: overall,
      isPending: validStatuses.some((s) => s.status === 'pending'),
      isComplete: validStatuses.every((s) => s.status === 'complete'),
      isError: validStatuses.some((s) => s.status === 'error'),
    };
  }, [statuses]);

  return {
    overallProgress,
    isPending,
    isComplete,
    isError,
    statuses,
  };
}
