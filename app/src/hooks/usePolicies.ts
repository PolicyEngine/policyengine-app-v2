import { useQuery } from '@tanstack/react-query';
import { policiesAPI } from '@/api/v2/policies';
import { useCurrentCountry } from './useCurrentCountry';

/**
 * Hook to fetch all policies from the API for the current country
 */
export const usePolicies = () => {
  const country = useCurrentCountry();

  return useQuery({
    queryKey: ['policies', country],
    queryFn: async () => {
      console.log(`[usePolicies] Fetching policies for country: ${country}...`);
      try {
        const allPolicies = await policiesAPI.list({ limit: 1000 });
        // Filter policies by country
        const countryPolicies = allPolicies.filter(
          policy => !policy.country || policy.country === country
        );
        console.log(`[usePolicies] Found ${countryPolicies.length} policies for ${country}`);
        return countryPolicies;
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
