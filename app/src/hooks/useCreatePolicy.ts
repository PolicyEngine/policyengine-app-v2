import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PolicyAdapter } from '@/adapters';
import { createPolicy, V2PolicyCreatePayload } from '@/api/policy';
import { fetchParametersByName, V2ParameterData } from '@/api/v2';
import { policyKeys } from '@/libs/queryKeys';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata';
import { useCurrentCountry } from './useCurrentCountry';
import { useTaxBenefitModelId } from './useTaxBenefitModel';
import { useUserId } from './useUserId';
import { useCreatePolicyAssociation } from './useUserPolicy';

interface CreatePolicyInput {
  policy: Policy;
  name?: string;
  description?: string;
}

export function useCreatePolicy(policyLabel?: string) {
  const queryClient = useQueryClient();
  const countryId = useCurrentCountry();
  const { taxBenefitModelId, isLoading: isModelLoading } = useTaxBenefitModelId(countryId);
  const createAssociation = useCreatePolicyAssociation();
  const userId = useUserId();

  const mutation = useMutation({
    mutationFn: async (input: CreatePolicyInput): Promise<{ id: string }> => {
      if (!taxBenefitModelId) {
        throw new Error('Tax benefit model ID not available');
      }

      // Batch-fetch parameter metadata for name→ID lookup
      const paramNames = (input.policy.parameters || []).map((p) => p.name);
      const paramData = await fetchParametersByName(paramNames, countryId);
      const parametersMetadata: Record<string, ParameterMetadata> = {};
      for (const p of paramData as V2ParameterData[]) {
        parametersMetadata[p.name] = {
          id: p.id,
          name: p.name,
          label: p.label ?? p.name,
          unit: p.unit,
          parameter: p.name,
          type: 'parameter',
          values: {},
        };
      }

      // Convert policy to v2 payload using adapter
      const payload: V2PolicyCreatePayload = PolicyAdapter.toV2CreationPayload(
        input.policy,
        parametersMetadata,
        taxBenefitModelId,
        input.name || policyLabel,
        input.description
      );

      const response = await createPolicy(payload);
      return { id: response.id };
    },
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: policyKeys.all });

        // Create association with current user (localStorage-persisted UUID)
        await createAssociation.mutateAsync({
          userId,
          policyId: data.id,
          countryId,
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
    isPending: mutation.isPending || isModelLoading,
    error: mutation.error,
    isModelReady: !!taxBenefitModelId,
  };
}
