/**
 * useCreateHousehold - Hook for creating households
 *
 * Creates a household in the API and stores an association for the user.
 * Uses the v2 Alpha API directly.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { createHouseholdV2 } from '@/api/v2/households';
import { householdKeys } from '@/libs/queryKeys';
import { Household } from '@/types/ingredients/Household';
import { useCreateHouseholdAssociation } from './useUserHousehold';
import { useUserId } from './useUserId';

export function useCreateHousehold(householdLabel?: string) {
  const queryClient = useQueryClient();
  const createAssociation = useCreateHouseholdAssociation();
  const userId = useUserId();

  const mutation = useMutation({
    mutationFn: async (household: Household) => {
      const created = await createHouseholdV2(household);
      return { householdId: created.id! };
    },
    onSuccess: async (data, variables) => {
      try {
        queryClient.invalidateQueries({ queryKey: householdKeys.all });

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
