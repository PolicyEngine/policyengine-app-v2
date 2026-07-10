import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useSyntheticProgress } from '@/hooks/useSyntheticProgress';
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
  const hasPendingStatus = statuses.some((status) => status?.status === 'pending');
  const syntheticProgress = useSyntheticProgress(hasPendingStatus, 'household');

  const { displayProgress, hasCalcStatus, message } = useMemo(() => {
    const validStatuses = statuses.filter((s): s is CalcStatus => !!s);

    if (validStatuses.length === 0) {
      // No CalcStatus available (e.g., after refresh)
      return { displayProgress: 0, hasCalcStatus: false, message: undefined };
    }

    if (hasPendingStatus) {
      return {
        displayProgress: syntheticProgress.progress,
        hasCalcStatus: true,
        message: syntheticProgress.message,
      };
    }

    if (validStatuses.every((status) => status.status === 'complete')) {
      return {
        displayProgress: 95,
        hasCalcStatus: true,
        message: 'Finalizing results...',
      };
    }

    const progress = validStatuses[0]?.progress || 0;
    const statusMessage = validStatuses[0]?.message;

    return { displayProgress: progress, hasCalcStatus: true, message: statusMessage };
  }, [statuses, hasPendingStatus, syntheticProgress]);

  return { displayProgress, hasCalcStatus, message };
}
