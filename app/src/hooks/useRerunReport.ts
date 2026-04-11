import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rerunReport, type ReportRerunResult } from '@/api/report';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';

export interface RerunReportParams {
  reportId: string;
  simulationIds?: string[];
}

function getUniqueSimulationIds(simulationIds: string[] | undefined): string[] {
  return [...new Set((simulationIds || []).filter(Boolean))];
}

export function useRerunReport() {
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ reportId }: RerunReportParams): Promise<ReportRerunResult> =>
      rerunReport(countryId, reportId),

    onSuccess: async (_result, variables) => {
      const simulationIds = getUniqueSimulationIds(variables.simulationIds);

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
