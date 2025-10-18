import { useEffect, useState, useMemo } from 'react';
import { useQueryClient, QueryObserver } from '@tanstack/react-query';
import { householdReportProgressKeys, calculationKeys } from '@/libs/queryKeys';
import type { HouseholdReportProgress } from '@/types/calculation/household';
import type { CalcStatus } from '@/types/calculation';

/**
 * Hook to subscribe to household report progress
 * Shows progress across all simulations
 *
 * USAGE:
 * const { progress, overallProgress, isComputing } = useHouseholdReportProgress(reportId);
 *
 * WHY THIS EXISTS:
 * Household reports run N independent calculations.
 * This hook aggregates their progress into a single view for the UI.
 * Works even after navigation (orchestrator persists in background).
 */
export function useHouseholdReportProgress(reportId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<HouseholdReportProgress | null>(null);

  useEffect(() => {
    if (!reportId) return;

    const queryKey = householdReportProgressKeys.byId(reportId);

    console.log(`[useHouseholdReportProgress] Subscribing to progress for report ${reportId}`);

    // Create observer
    const observer = new QueryObserver<HouseholdReportProgress>(queryClient, {
      queryKey,
    });

    // Subscribe to updates
    const unsubscribe = observer.subscribe((result) => {
      if (result.data) {
        console.log(`[useHouseholdReportProgress] Progress update:`, result.data.overallStatus);
        setProgress(result.data);
      }
    });

    // Get initial value
    const initial = queryClient.getQueryData<HouseholdReportProgress>(queryKey);
    if (initial) {
      console.log(`[useHouseholdReportProgress] Initial progress:`, initial.overallStatus);
      setProgress(initial);
    }

    return () => {
      console.log(`[useHouseholdReportProgress] Unsubscribing from report ${reportId}`);
      unsubscribe();
    };
  }, [reportId, queryClient]);

  // Calculate overall progress percentage across all simulations
  const overallProgress = useMemo(() => {
    if (!progress) return 0;

    const simProgresses = progress.simulationIds.map((simId) => {
      const simStatus = queryClient.getQueryData<CalcStatus>(calculationKeys.bySimulationId(simId));
      return simStatus?.progress || 0;
    });

    if (simProgresses.length === 0) return 0;

    return simProgresses.reduce((sum, p) => sum + p, 0) / simProgresses.length;
  }, [progress]); // queryClient is stable, doesn't need to be in dependencies

  return {
    progress,
    overallProgress,
    isComputing: progress?.overallStatus === 'computing',
    isComplete: progress?.overallStatus === 'complete',
    isError: progress?.overallStatus === 'error',
    simulationStatuses: progress?.simulations || {},
  };
}
