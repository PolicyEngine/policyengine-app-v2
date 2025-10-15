import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { createHousehold } from '@/api/household';
import { MOCK_USER_ID } from '@/constants';
import { householdKeys } from '@/libs/queryKeys';
import { selectCurrentCountry } from '@/reducers/metadataReducer';
import { useCreateHouseholdAssociation } from './useUserHousehold';

export function useCreateHousehold(householdLabel?: string) {
  const queryClient = useQueryClient();
  const country = useSelector(selectCurrentCountry) || 'us';
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateHouseholdAssociation();

  const mutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: householdKeys.all });

        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID
        await createAssociation.mutateAsync({
          userId,
          householdId: data.result.household_id, // This is from the API response structure; may be modified in API v2
          countryId: country,
          label: householdLabel,
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
