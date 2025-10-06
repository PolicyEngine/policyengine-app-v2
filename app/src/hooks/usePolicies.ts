import { useQuery } from '@tanstack/react-query';
import { policiesAPI } from '@/api/v2/policies';
import { useCurrentModel } from './useCurrentModel';

/**
 * Hook to fetch all policies from the API for the current user's model
 */
export const usePolicies = () => {
  const { modelId } = useCurrentModel();

  return useQuery({
    queryKey: ['policies', modelId],
    queryFn: async () => {
      console.log(`[usePolicies] Fetching policies for model: ${modelId}...`);
      try {
        const allPolicies = await policiesAPI.list({ limit: 1000 });
        console.log(`[usePolicies] Raw API response:`, allPolicies);
        console.log(`[usePolicies] First policy:`, allPolicies[0]);

        // Filter policies by model if model_id is available
        // If model_id is not returned by API, return all policies
        const modelPolicies = allPolicies.filter(
          policy => {
            console.log(`[usePolicies] Checking policy ${policy.id}: model_id=${policy.model_id}, matches=${policy.model_id === modelId}`);
            return !policy.model_id || policy.model_id === modelId;
          }
        );
        console.log(`[usePolicies] Found ${modelPolicies.length} policies for ${modelId}`);
        return modelPolicies;
      } catch (error) {
        console.error('[usePolicies] Error fetching policies:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
};

/**
 * Hook to fetch a single policy by ID
 */
export const usePolicy = (policyId: string) => {
  return useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => policiesAPI.get(policyId),
    enabled: !!policyId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch a policy with its parameters
 */
export const usePolicyWithParameters = (policyId: string) => {
  return useQuery({
    queryKey: ['policy-with-parameters', policyId],
    queryFn: () => policiesAPI.getWithParameters(policyId),
    enabled: !!policyId,
    staleTime: 30 * 1000,
  });
};
