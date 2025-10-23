import { useQueries } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Subscribe to CalcStatus for a single simulation
 * Only subscribes to cache updates, doesn't fetch
 *
 * @param simulationId - The simulation ID to subscribe to
 * @returns CalcStatus if available in cache, undefined otherwise
 */
export function useCalcStatusSubscription(
  simulationId: string | undefined
): CalcStatus | undefined {
  const queries = useQueries({
    queries: [
      {
        queryKey: simulationId
          ? calculationKeys.bySimulationId(simulationId)
          : (['placeholder'] as const),
        queryFn: async (): Promise<CalcStatus | undefined> => undefined,
        enabled: false, // Cache-only subscription, don't fetch
        staleTime: Infinity, // Never mark as stale
      },
    ],
  });

  return queries[0]?.data as CalcStatus | undefined;
}

/**
 * Subscribe to CalcStatus for multiple simulations
 * Returns the first pending status, or undefined if none are calculating
 *
 * This is useful for household reports where multiple simulations may be running
 * in parallel, and we want to show progress for whichever one is actively calculating.
 *
 * @param simulationIds - Array of simulation IDs to subscribe to
 * @returns Object with calculation state and progress info
 */
export function useMultiSimulationCalcStatus(simulationIds: string[]) {
  // Ensure we always have at least one query to satisfy useQueries type requirements
  const queryConfigs =
    simulationIds.length > 0
      ? simulationIds.map((simId) => ({
          queryKey: calculationKeys.bySimulationId(simId) as readonly unknown[],
          queryFn: async (): Promise<CalcStatus | undefined> => undefined,
          enabled: false, // Cache-only subscription, don't fetch
          staleTime: Infinity, // Never mark as stale
        }))
      : [
          {
            queryKey: ['placeholder'] as const,
            queryFn: async (): Promise<CalcStatus | undefined> => undefined,
            enabled: false,
            staleTime: Infinity,
          },
        ];

  const queries = useQueries({
    queries: queryConfigs,
  });

  // If no simulation IDs, return empty state
  if (simulationIds.length === 0) {
    return {
      isCalculating: false,
      progress: undefined,
      message: undefined,
      calcStatus: undefined,
    };
  }

  // Find first pending calculation
  const activeCalc = queries.find((q) => {
    const data = q.data as CalcStatus | undefined;
    return data?.status === 'pending';
  })?.data as CalcStatus | undefined;

  return {
    isCalculating: !!activeCalc,
    progress: activeCalc?.progress,
    message: activeCalc?.message,
    calcStatus: activeCalc,
  };
}
