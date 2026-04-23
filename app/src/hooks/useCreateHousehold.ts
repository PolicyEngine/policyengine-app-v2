import { useMutation } from '@tanstack/react-query';
import { createHousehold } from '@/api/household';
import { assertSupportedMode, usesV2ShadowMode } from '@/config/migrationMode';
import { MOCK_USER_ID } from '@/constants';
import { countryIds } from '@/libs/countries';
import { shadowCreateHouseholdAndAssociation } from '@/libs/migration/householdShadow';
import { Household } from '@/models/Household';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { useCreateHouseholdAssociation } from './useUserHousehold';

export function useCreateHousehold(householdLabel?: string) {
  const householdWriteMode = assertSupportedMode(
    'households',
    ['v1_only', 'v1_primary_v2_shadow'],
    'useCreateHousehold'
  );
  const shouldShadowV2 = usesV2ShadowMode(householdWriteMode);
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateHouseholdAssociation();

  const mutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: async (data, householdPayload) => {
      const resolvedLabel = householdLabel ?? householdPayload.label;
      let association: UserHouseholdPopulation | undefined;

      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        association = await createAssociation.mutateAsync({
          userId,
          householdId: data.result.household_id, // This is from the API response structure; may be modified in API v2
          countryId: householdPayload.country_id as (typeof countryIds)[number], // Use the country from the creation payload
          label: resolvedLabel,
        });
      } catch (error) {
        console.error('Household created but association failed:', error);
      }

      if (shouldShadowV2) {
        void shadowCreateHouseholdAndAssociation({
          v1HouseholdId: data.result.household_id,
          v1Household: Household.fromV1CreationPayload(householdPayload, {
            id: data.result.household_id,
            label: resolvedLabel ?? null,
          }),
          v1Association: association,
        });
      }
    },
  });

  return {
    createHousehold: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
