import { useMutation } from '@tanstack/react-query';
import { createPolicy } from '@/api/policy';
import { MOCK_USER_ID } from '@/constants';
import { PolicyCreationPayload } from '@/types/payloads';
import { useCurrentCountry } from './useCurrentCountry';
import { useCreatePolicyAssociation } from './useUserPolicy';

interface CreatePolicyVariables {
  payload: PolicyCreationPayload;
  label?: string;
}

export function useCreatePolicy(policyLabel?: string) {
  const countryId = useCurrentCountry();
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreatePolicyAssociation();

  const mutation = useMutation({
    mutationFn: ({ payload }: CreatePolicyVariables) => createPolicy(countryId, payload),
    onSuccess: async (data, { label }) => {
      const resolvedLabel = label ?? policyLabel;

      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        await createAssociation.mutateAsync({
          userId,
          policyId: data.result.policy_id, // This is from the API response structure; may be modified in API v2
          countryId,
          label: resolvedLabel,
          isCreated: true,
        });
      } catch (error) {
        console.error('Policy created but association failed:', error);
      }
    },
  });

  const createPolicyWithLabel = (
    payload: PolicyCreationPayload,
    label?: string,
    options?: Parameters<typeof mutation.mutateAsync>[1]
  ) => mutation.mutateAsync({ payload, label }, options);

  return {
    createPolicy: (
      payload: PolicyCreationPayload,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => createPolicyWithLabel(payload, policyLabel, options),
    createPolicyWithLabel,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
