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

export function useCreateReport(reportLabel?: string) {
  const queryClient = useQueryClient();
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateReportAssociation();

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
        const countryId = data.country_id;

        // Determine calculation type from simulation data
        const isHouseholdCalc = simulation1?.populationType === 'household';
        const reportIdStr = String(data.id);

        // Build calculation metadata
        const calculationMeta: CalculationMeta = {
          type: isHouseholdCalc ? 'household' : 'economy',
          countryId,
          policyIds: {
            baseline: simulation1?.policyId || '',
            reform: simulation2?.policyId,
          },
          populationId: '',
        };

        if (isHouseholdCalc && household1?.id && simulation1?.policyId) {
          // For household calculations
          calculationMeta.populationId = household1.id;

          // Store metadata and trigger calculation
          queryClient.setQueryData(['calculation-meta', reportIdStr], calculationMeta);

          await queryClient.prefetchQuery(
            calculationQueries.forReport(reportIdStr, calculationMeta, queryClient)
          );
        } else if (simulation1?.policyId && geography1) {
          // For economy calculations
          calculationMeta.populationId = geography1.id || geography1.geographyId || countryId;

          // Add region if subnational
          if (geography1.scope === 'subnational' && geography1.geographyId) {
            calculationMeta.region = geography1.geographyId;
          }

          // Store metadata and trigger calculation
          queryClient.setQueryData(['calculation-meta', reportIdStr], calculationMeta);

          await queryClient.prefetchQuery(
            calculationQueries.forReport(reportIdStr, calculationMeta, queryClient)
          );
        }
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
