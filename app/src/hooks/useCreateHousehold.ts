import { useMutation } from '@tanstack/react-query';
import { createHousehold } from '@/api/household';
import { MOCK_USER_ID } from '@/constants';
import { countryIds } from '@/libs/countries';
import { shadowCreateHouseholdAndAssociation } from '@/libs/migration/householdShadow';
import { Household } from '@/models/Household';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { HouseholdCreationPayload } from '@/types/payloads';
import { getHouseholdWriteConfig, useCreateHouseholdAssociation } from './useUserHousehold';

interface CreateHouseholdVariables {
  payload: HouseholdCreationPayload;
  label?: string;
}

export function useCreateHousehold(householdLabel?: string) {
  const { shouldShadowV2 } = getHouseholdWriteConfig('useCreateHousehold');
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateHouseholdAssociation({
    skipDuplicateV2AssociationShadow: true,
  });

  const mutation = useMutation({
    mutationFn: ({ payload }: CreateHouseholdVariables) => createHousehold(payload),
    onSuccess: async (data, { payload, label }) => {
      const resolvedLabel = label ?? householdLabel ?? payload.label;
      let association: UserHouseholdPopulation | undefined;

      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        association = await createAssociation.mutateAsync({
          userId,
          householdId: data.result.household_id, // This is from the API response structure; may be modified in API v2
          countryId: payload.country_id as (typeof countryIds)[number], // Use the country from the creation payload
          label: resolvedLabel,
        });
      } catch (error) {
        console.error('Household created but association failed:', error);
      }

      if (shouldShadowV2) {
        void shadowCreateHouseholdAndAssociation({
          v1HouseholdId: data.result.household_id,
          v1Household: Household.fromV1CreationPayload(payload, {
            id: data.result.household_id,
            label: resolvedLabel ?? null,
          }),
          v1Association: association,
        });
      }
    },
  });

  const createHouseholdWithLabel = (
    payload: HouseholdCreationPayload,
    label?: string,
    options?: Parameters<typeof mutation.mutateAsync>[1]
  ) => mutation.mutateAsync({ payload, label }, options);

  return {
    createHousehold: (
      payload: HouseholdCreationPayload,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => createHouseholdWithLabel(payload, householdLabel, options),
    createHouseholdWithLabel,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
