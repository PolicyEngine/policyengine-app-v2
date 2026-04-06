import { useMutation } from '@tanstack/react-query';
import { createHousehold } from '@/api/household';
import { MOCK_USER_ID } from '@/constants';
import { countryIds } from '@/libs/countries';
import { captureApiException } from '@/utils/errorTracking';
import { useCreateHouseholdAssociation } from './useUserHousehold';

export function useCreateHousehold(householdLabel?: string) {
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateHouseholdAssociation();

  const mutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: async (data, variables) => {
      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID
        await createAssociation.mutateAsync({
          userId,
          householdId: data.result.household_id, // This is from the API response structure; may be modified in API v2
          countryId: variables.country_id as (typeof countryIds)[number], // Use the country from the creation payload
          label: householdLabel,
        });
      } catch (error) {
        console.error('Household created but association failed:', error);
        captureApiException(error, {
          source: 'household_association',
          country_id: variables.country_id,
          household_id: data.result.household_id,
          has_label: Boolean(householdLabel),
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
