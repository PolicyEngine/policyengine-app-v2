import { useQuery } from '@tanstack/react-query';
import { policiesAPI } from '@/api/v2/policies';

/**
 * Hook to fetch all policies from the API
 */
export const usePolicies = () => {
  return useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      console.log('[usePolicies] Fetching policies from API...');
      try {
        const policies = await policiesAPI.list({ limit: 1000 });
        console.log('[usePolicies] Successfully fetched policies:', policies);
        return policies;
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