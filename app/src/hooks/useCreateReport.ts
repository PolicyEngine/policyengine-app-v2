import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReport } from '@/api/report';
import { fetchEconomyCalculation, EconomyCalculationParams } from '@/api/economy';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { MOCK_USER_ID } from '@/constants';
import { reportKeys } from '@/libs/queryKeys';
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

/**
 * Helper function to format economy calculation parameters
 * Removes undefined values to prevent them from being serialized as "undefined" strings
 */
function formatEconomyParams(geography: Geography | null | undefined): EconomyCalculationParams {
  if (!geography) {
    return {};
  }

  const params: EconomyCalculationParams = {};

  // Only add region if it's subnational and has a valid geographyId
  if (geography.scope === 'subnational' && geography.geographyId) {
    params.region = geography.geographyId;
  }

  return params;
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

        if (isHouseholdCalc && household1?.id && simulation1?.policyId) {
          // For household calculations, use the household IDs
          const householdId = household1.id;
          await queryClient.prefetchQuery({
            queryKey: ['household_calculation', countryId, householdId, simulation1.policyId],
            queryFn: () => fetchHouseholdCalculation(
              countryId,
              householdId,
              simulation1.policyId!
            ),
          });

          // If there's a second simulation (reform), trigger that calculation too
          // Note: For household, we typically use the same household with different policies
          if (simulation2?.policyId) {
            await queryClient.prefetchQuery({
              queryKey: ['household_calculation', countryId, householdId, simulation2.policyId],
              queryFn: () => fetchHouseholdCalculation(
                countryId,
                householdId,
                simulation2.policyId!
              ),
            });
          }
        } else if (simulation1?.policyId && geography1) {
          // For economy calculations, use geography data
          const baselinePolicyId = simulation1.policyId;
          const reformPolicyId = simulation2?.policyId || baselinePolicyId;

          // Format economy parameters, filtering out undefined values
          const economyParams = formatEconomyParams(geography1);

          // Trigger economy calculation - initial fetch
          // Note: Polling will be handled by the component that uses this data
          await queryClient.prefetchQuery({
            queryKey: ['economy', countryId, reformPolicyId, baselinePolicyId, economyParams],
            queryFn: () => fetchEconomyCalculation(
              countryId,
              reformPolicyId,
              baselinePolicyId,
              economyParams
            ),
          });
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
