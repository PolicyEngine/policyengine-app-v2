import { useMutation } from '@tanstack/react-query';
import { createPolicy } from '@/api/policy';
import { useCurrentUserId } from '@/libs/auth/useAssociationBackend';
import { reportSaveFailure } from '@/libs/saveFailureNotice';
import { PolicyCreationPayload } from '@/types/payloads';
import { useCurrentCountry } from './useCurrentCountry';
import { useCreatePolicyAssociation } from './useUserPolicy';

interface CreatePolicyVariables {
  payload: PolicyCreationPayload;
  label?: string;
}

export function useCreatePolicy(policyLabel?: string) {
  const countryId = useCurrentCountry();
  const userId = useCurrentUserId();
  const createAssociation = useCreatePolicyAssociation();

  const mutation = useMutation({
    mutationFn: ({ payload }: CreatePolicyVariables) => createPolicy(countryId, payload),
    onSuccess: async (data, { label }) => {
      const resolvedLabel = label ?? policyLabel;

      try {
        // File the association under the current user (the account when
        // signed in, localStorage otherwise)
        await createAssociation.mutateAsync({
          userId,
          policyId: data.result.policy_id,
          countryId,
          label: resolvedLabel,
          isCreated: true,
        });
      } catch (error) {
        console.error('Policy created but association failed:', error);
        // The builder carries on with the created policy; tell the user it
        // is not in their saved work (account unavailable, too large, down).
        reportSaveFailure('policy', error);
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
