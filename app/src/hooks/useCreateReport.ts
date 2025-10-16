import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReportAndAssociateWithUser, CreateReportWithAssociationResult } from '@/api/report';
import { MOCK_USER_ID } from '@/constants';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { countryIds } from '@/libs/countries';
import { reportKeys } from '@/libs/queryKeys';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { ReportCreationPayload } from '@/types/payloads';
import { CalcStartConfig } from '@/types/calculation';

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
  const orchestrator = new CalcOrchestrator(queryClient, new ResultPersister(queryClient));
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

        // Determine calculation type from simulation
        const simulation1 = simulations?.simulation1;
        const simulation2 = simulations?.simulation2;
        const household = populations?.household1;
        const geography = populations?.geography1;

        if (!simulation1) {
          console.warn('[useCreateReport] No simulation1 provided, cannot start calculation');
          return;
        }

        // Determine target type based on population type
        const targetType: 'report' | 'simulation' =
          simulation1.populationType === 'household' ? 'simulation' : 'report';

        // Build calculation config
        const calcConfig: CalcStartConfig = {
          calcId: reportIdStr,
          targetType,
          countryId: report.country_id,
          simulations: {
            simulation1,
            simulation2: simulation2 || null,
          },
          populations: {
            household1: household || null,
            household2: null,
            geography1: geography || null,
            geography2: null,
          },
        };

        // Start calculation using new orchestrator
        await orchestrator.startCalculation(calcConfig);
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
