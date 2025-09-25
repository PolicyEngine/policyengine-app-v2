import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReport } from '@/api/report';
import { MOCK_USER_ID } from '@/constants';
import { reportKeys } from '@/libs/queryKeys';
import { calculationQueries } from '@/libs/queryOptions/calculations';
import { CalculationMeta } from '@/api/reportCalculations';
import { ReportCreationPayload } from '@/types/payloads';
import { Simulation } from '@/types/ingredients/Simulation';
import { Household } from '@/types/ingredients/Household';
import { Geography } from '@/types/ingredients/Geography';
import { useCreateReportAssociation } from './useUserReportAssociations';
import { countryIds } from '@/libs/countries';
import { getCalculationManager, determineCalculationType, extractPopulationId, extractRegion } from '@/libs/calculations';

interface CreateReportAndBeginCalculationParams {
  countryId: typeof countryIds[number];
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

// Note: Much of this code's complexity is due to mapping v2 concepts (simulations, populations)
// to the v1 API, which cannot run reports as subsets of simulations. This should be simplified
// with the creation of API v2, where we can merely pass simulation IDs to create a report.
export function useCreateReport(reportLabel?: string) {
  const queryClient = useQueryClient();
  const createAssociation = useCreateReportAssociation();

  const manager = getCalculationManager(queryClient);

  const mutation = useMutation({
    mutationFn: ({ countryId, payload }: CreateReportAndBeginCalculationParams) =>
      createReport(countryId as any, payload),
    onSuccess: async (data, variables) => {
      try {
        queryClient.invalidateQueries({ queryKey: reportKeys.all });

        console.log('Report label in useCreateReport:', reportLabel);

        // Store report data in cache for easy access
        queryClient.setQueryData(['report', String(data.id)], data);

        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        await createAssociation.mutateAsync({
          userId,
          reportId: String(data.id), // Convert the numeric ID from metadata to string
          label: reportLabel,
          isCreated: true,
        });

        const { simulation1, simulation2 } = variables.simulations || {};
        const { household1, geography1 } = variables.populations || {};

        // Clean and explicit type determination and data extraction
        const calcType = determineCalculationType(simulation1 || null);
        const populationId = extractPopulationId(calcType, household1, geography1);
        const region = calcType === 'economy' ? extractRegion(geography1) : undefined;

        // Build metadata
        const calculationMeta: CalculationMeta = {
          type: calcType,
          countryId: data.country_id,
          policyIds: {
            baseline: simulation1?.policyId || '',
            reform: simulation2?.policyId,
          },
          populationId,
          region,
        };

        const reportIdStr = String(data.id);

        // Store metadata
        queryClient.setQueryData(['calculation-meta', reportIdStr], calculationMeta);

        // Start calculation (for household, this initiates the long-running request)
        await manager.startCalculation(reportIdStr, calculationMeta);

        // Prefetch to populate cache
        await queryClient.prefetchQuery(
          calculationQueries.forReport(reportIdStr, calculationMeta, queryClient, data.country_id)
        );
      } catch (error) {
        console.error('Report created but post-creation tasks failed:', error);
      }
    },
  });

  return {
    createReport: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
