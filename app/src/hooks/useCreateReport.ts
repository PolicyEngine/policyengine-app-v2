import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReportAndAssociateWithUser, CreateReportWithAssociationResult } from '@/api/report';
import { MOCK_USER_ID } from '@/constants';
import { getCalculationManager } from '@/libs/calculations';
import { countryIds } from '@/libs/countries';
import { reportKeys } from '@/libs/queryKeys';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { ReportCreationPayload } from '@/types/payloads';

interface CreateReportAndBeginCalculationParams {
  countryId: (typeof countryIds)[number];
  payload: ReportCreationPayload;
  simulations?: {
    simulation1?: Simulation | null;
    simulation2?: Simulation | null;
  };
  populations?: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };
}

// Extended result type that includes simulations and populations for onSuccess
interface ExtendedCreateReportResult extends CreateReportWithAssociationResult {
  simulations?: {
    simulation1?: Simulation | null;
    simulation2?: Simulation | null;
  };
  populations?: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };
}

// Note: Much of this code's complexity is due to mapping v2 concepts (simulations, populations)
// to the v1 API, which cannot run reports as subsets of simulations. This should be simplified
// with the creation of API v2, where we can merely pass simulation IDs to create a report.
export function useCreateReport(reportLabel?: string) {
  const queryClient = useQueryClient();
  const manager = getCalculationManager(queryClient);
  const userId = MOCK_USER_ID;

  const mutation = useMutation({
    mutationFn: async ({
      countryId,
      payload,
      simulations,
      populations,
    }: CreateReportAndBeginCalculationParams): Promise<ExtendedCreateReportResult> => {
      // Call the combined API function
      const result = await createReportAndAssociateWithUser({
        countryId: countryId as any,
        payload,
        userId,
        label: reportLabel,
      });

      // Attach simulations and populations for use in onSuccess
      return {
        ...result,
        simulations,
        populations,
      };
    },

    onSuccess: async (result) => {
      try {
        const { report, simulations, populations } = result;
        const reportIdStr = String(report.id);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: reportKeys.all });

        // Cache the report data
        queryClient.setQueryData(['report', reportIdStr], report);

        // Build metadata
        const calculationMeta = manager.buildMetadata({
          simulation1: simulations?.simulation1 || null,
          simulation2: simulations?.simulation2 || null,
          household: populations?.household1,
          geography: populations?.geography1,
          countryId: report.country_id,
        });

        // Store metadata; we need to do this because API v1 doesn't run report by 
        // report ID, but rather by simulation + population; should not be necessary in
        // API v2
        queryClient.setQueryData(['calculation-meta', reportIdStr], calculationMeta);

        // Get query configuration from manager
        const queryOptions = manager.getQueryOptions(reportIdStr, calculationMeta);

        // Start calculation via TanStack Query
        await queryClient.prefetchQuery(queryOptions);

        // For household, start progress updates
        if (calculationMeta.type === 'household') {
          await manager.startCalculation(reportIdStr, calculationMeta);
        }
      } catch (error) {
        console.error('Post-creation tasks failed:', error);
      }
    },
  });

  return {
    createReport: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
