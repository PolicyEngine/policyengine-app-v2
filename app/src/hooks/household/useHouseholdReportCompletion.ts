import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markReportCompleted } from '@/api/report';
import { reportKeys, simulationKeys, calculationKeys } from '@/libs/queryKeys';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { CalcStatus } from '@/types/calculation';

/**
 * Hook to reactively mark household report as complete
 * Watches simulation statuses and updates report when all are done
 *
 * SIMPLIFIED ARCHITECTURE:
 * - No HouseholdReportProgress tracking
 * - Uses simulation.status (from cache) as source of truth
 * - Marks report complete when all simulations are complete
 * - Report gets output: null (outputs live on simulations)
 */
export function useHouseholdReportCompletion(
  report: Report | undefined,
  simulations: Simulation[] | undefined
) {
  const queryClient = useQueryClient();

  // Get simulation IDs - ensure stable array reference
  const simulationIds = useMemo(() => {
    return simulations?.map(s => s.id).filter((id): id is string => !!id) || [];
  }, [simulations]);

  // Create stable key to track simulation changes
  const simulationStatuses = useMemo(() => {
    if (!simulations || simulations.length === 0) return '';
    return simulations.map(s => `${s.id}:${s.status}:${!!s.output}`).join('|');
  }, [simulations]);

  const reportStatus = report?.status || '';

  useEffect(() => {
    if (!report?.id || !simulations || simulations.length === 0) return;

    // Check CalcStatus from cache (source of truth for completion)
    const calcStatuses = simulationIds.map(simId =>
      queryClient.getQueryData<CalcStatus>(calculationKeys.bySimulationId(simId))
    ).filter((s): s is CalcStatus => !!s);

    // Also get live simulation data for output check
    const liveSimulations = simulationIds.map(simId =>
      queryClient.getQueryData<Simulation>(simulationKeys.byId(simId))
    ).filter((s): s is Simulation => !!s);

    const allComplete = calcStatuses.length === simulationIds.length &&
                       calcStatuses.every((cs) => cs.status === 'complete') &&
                       liveSimulations.every((sim) => sim.output);
    const someError = calcStatuses.some((cs) => cs.status === 'error');
    const reportNotMarked = report.status !== 'complete' && report.status !== 'error';

    console.log('[useHouseholdReportCompletion] Checking completion:', {
      allComplete,
      someError,
      reportNotMarked,
      calcStatuses: calcStatuses.map(cs => ({ simId: cs.metadata.calcId, status: cs.status })),
      simOutputs: liveSimulations.map(s => ({ id: s.id, hasOutput: !!s.output })),
    });

    // Mark report complete when all simulations are complete
    if (allComplete && reportNotMarked) {
      console.log('[useHouseholdReportCompletion] All simulations complete, marking report complete');

      const completedReport: Report = {
        ...report,
        status: 'complete',
        outputType: 'household',
        // No output for household reports - outputs live on simulations
      };

      markReportCompleted(report.countryId, report.id, completedReport)
        .then(() => {
          console.log('[useHouseholdReportCompletion] Report marked complete successfully');

          // Invalidate report cache to refetch with new status
          queryClient.invalidateQueries({
            queryKey: reportKeys.byId(report.id!),
          });
        })
        .catch((error) => {
          console.error('[useHouseholdReportCompletion] Failed to mark report complete:', error);
        });
    }

    // Mark report as error if any simulation errored
    if (someError && reportNotMarked) {
      console.log('[useHouseholdReportCompletion] Some simulations errored, marking report as error');

      const errorReport: Report = {
        ...report,
        status: 'error',
        outputType: 'household',
      };

      markReportCompleted(report.countryId, report.id, errorReport)
        .then(() => {
          console.log('[useHouseholdReportCompletion] Report marked error successfully');

          queryClient.invalidateQueries({
            queryKey: reportKeys.byId(report.id!),
          });
        })
        .catch((error) => {
          console.error('[useHouseholdReportCompletion] Failed to mark report error:', error);
        });
    }
  }, [report?.id, simulationStatuses, reportStatus, queryClient, simulationIds, report]);
}
