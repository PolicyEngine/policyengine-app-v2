import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPolicy } from '@/api/policy';
import { policyKeys } from '@/libs/queryKeys';
import { useCreatePolicyAssociation } from './useUserPolicy';

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  // const user = undefined; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreatePolicyAssociation();

  const mutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: policyKeys.all });

        // Create association with current user (or anonymous for session storage)
        const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID
        await createAssociation.mutateAsync({
          userId,
          policyId: data.result.policy_id, // This is from the API response structure; may be modified in API v2
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
