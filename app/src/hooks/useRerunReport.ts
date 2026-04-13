import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rerunReport, type ReportRerunResult } from '@/api/report';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

export interface RerunReportParams {
  reportId: string;
  simulationIds?: string[];
}

function getUniqueSimulationIds(simulationIds: string[] | undefined): string[] {
  return [...new Set((simulationIds || []).filter(Boolean))];
}

function resetCachedReport(report: Report | undefined): Report | undefined {
  if (!report) {
    return report;
  }

  return {
    ...report,
    status: 'pending',
    output: null,
  };
}

function resetCachedSimulation(simulation: Simulation | undefined): Simulation | undefined {
  if (!simulation) {
    return simulation;
  }

  return {
    ...simulation,
    status: 'pending',
    output: null,
  };
}

export function useRerunReport() {
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ reportId }: RerunReportParams): Promise<ReportRerunResult> =>
      rerunReport(countryId, reportId),

    onSuccess: async (_result, variables) => {
      const simulationIds = getUniqueSimulationIds(variables.simulationIds);

      queryClient.setQueryData<Report | undefined>(
        reportKeys.byId(variables.reportId),
        resetCachedReport
      );

      for (const simulationId of simulationIds) {
        queryClient.setQueryData<Simulation | undefined>(
          simulationKeys.byId(simulationId),
          resetCachedSimulation
        );
      }

      queryClient.removeQueries({
        queryKey: calculationKeys.byReportId(variables.reportId),
        exact: true,
      });

      for (const simulationId of simulationIds) {
        queryClient.removeQueries({
          queryKey: calculationKeys.bySimulationId(simulationId),
          exact: true,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: reportKeys.byId(variables.reportId),
        }),
        ...simulationIds.map((simulationId) =>
          queryClient.invalidateQueries({
            queryKey: simulationKeys.byId(simulationId),
          })
        ),
      ]);
    },
  });

  return {
    rerunReport: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
