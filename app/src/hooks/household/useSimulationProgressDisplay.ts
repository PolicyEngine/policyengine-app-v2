import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Hook to get display-only progress from CalcStatus
 *
 * IMPORTANT: This is for DISPLAY ONLY, not for state decisions.
 * Use Simulation.status for state decisions (is complete? needs calc?)
 *
 * This hook returns progress percentage for progress bars.
 * If CalcStatus doesn't exist (e.g., after page refresh), returns 0.
 */
export function useSimulationProgressDisplay(simulationIds: string[]) {
  const queries = useQueries({
    queries: simulationIds.map((simId) => ({
      queryKey: calculationKeys.bySimulationId(simId),
      enabled: !!simId,
      staleTime: Infinity,
    })),
  });

  const statuses = queries.map((q) => q.data as CalcStatus | undefined);

  const { displayProgress, hasCalcStatus } = useMemo(() => {
    const validStatuses = statuses.filter((s): s is CalcStatus => !!s);

    if (validStatuses.length === 0) {
      // No CalcStatus available (e.g., after refresh)
      return { displayProgress: 0, hasCalcStatus: false };
    }

    // Calculate average progress across all simulations
    const progresses = validStatuses.map((s) => s.progress || 0);
    const avgProgress = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;

    return { displayProgress: avgProgress, hasCalcStatus: true };
  }, [statuses]);

  return { displayProgress, hasCalcStatus };
}
