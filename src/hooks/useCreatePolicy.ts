import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPolicy } from '@/api/policy';
import { useCreatePolicyAssociation } from './useUserPolicy';
import { policyKeys } from '@/libs/queryKeys';

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  const user = undefined; // Replace with actual user context or auth hook in future
  const createAssociation = useCreatePolicyAssociation();

  const mutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: policyKeys.all });

        // Create association with current user (or anonymous for session storage)
        const userId = user?.id || 'anonymous'; // TODO: Replace with actual user ID retrieval logic
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