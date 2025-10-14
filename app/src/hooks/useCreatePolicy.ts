import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPolicy } from '@/api/policy';
import { MOCK_USER_ID } from '@/constants';
import { policyKeys } from '@/libs/queryKeys';
import { PolicyCreationPayload } from '@/types/payloads';
import { useCreatePolicyAssociation } from './useUserPolicy';
import { useCurrentCountry } from './useCurrentCountry';

export function useCreatePolicy(policyLabel?: string) {
  const queryClient = useQueryClient();
  const countryId = useCurrentCountry();
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreatePolicyAssociation();

  const mutation = useMutation({
    mutationFn: (data: PolicyCreationPayload) => createPolicy(countryId, data),
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: policyKeys.all });

        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        await createAssociation.mutateAsync({
          userId,
          policyId: data.result.policy_id, // This is from the API response structure; may be modified in API v2
          label: policyLabel,
          isCreated: true,
        });
      } catch (error) {
        console.error('Policy created but association failed:', error);
      }
    },
  });

  return {
    createPolicy: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
