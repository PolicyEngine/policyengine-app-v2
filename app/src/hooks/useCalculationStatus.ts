import { useQuery } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Hook to read calculation status from cache
 * Does not fetch - only reads existing status from cache
 * Auto-subscribes to cache updates from background calculation queries
 */
export function useCalculationStatus(calcId: string, targetType: 'report' | 'simulation') {
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
