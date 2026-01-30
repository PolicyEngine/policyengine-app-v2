/**
 * useCreateHousehold - Hook for creating households
 *
 * Creates a household in the API and stores an association for the user.
 * Works with the v2 Alpha household format.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { createHousehold } from '@/api/household';
import { MOCK_USER_ID } from '@/constants';
import { householdKeys } from '@/libs/queryKeys';
import { Household } from '@/types/ingredients/Household';
import { useCreateHouseholdAssociation } from './useUserHousehold';

export function useCreateHousehold(householdLabel?: string) {
  const queryClient = useQueryClient();
  const createAssociation = useCreateHouseholdAssociation();

  const mutation = useMutation({
    mutationFn: (household: Household) => createHousehold(household),
    onSuccess: async (data, variables) => {
      try {
        queryClient.invalidateQueries({ queryKey: householdKeys.all });

        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic
        const countryId = modelNameToCountryId(variables.tax_benefit_model_name);

        await createAssociation.mutateAsync({
          userId,
          householdId: data.householdId,
          countryId,
          label: householdLabel ?? variables.label,
        });
      } catch (error) {
        console.error('Household created but association failed:', error);
      }
    },
  });

  return {
    createHousehold: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
