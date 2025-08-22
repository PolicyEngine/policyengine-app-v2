import { useQueries, useQueryClient } from '@tanstack/react-query';
import { normalize, denormalize } from 'normy';
import { fetchPolicyById } from '@/api/policy';
import { PolicyAdapter } from '@/adapters';
import { policySchema, userPolicySchema } from '@/schemas/ingredientSchemas';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { policyKeys } from '../libs/queryKeys';

interface NormalizedPolicyData {
  entities: {
    policies?: Record<string, any>;
    userPolicies?: Record<string, any>;
  };
  result: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Enhanced hook that fetches user policies and returns normalized data for easy access by ID
 * Implements intelligent caching to avoid redundant API calls
 */
export const useUserPoliciesNormalized = (userId: string) => {
  const queryClient = useQueryClient();
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic

  // First, get the user-policy associations
  const {
    data: policyAssociations,
    isLoading: associationsLoading,
    error: associationsError,
  } = usePolicyAssociationsByUser(userId);

  // Extract policy IDs
  const policyIds = policyAssociations?.map((a) => a.policyId) ?? [];

  // Fetch all policies in parallel, checking cache first
  const policyQueries = useQueries({
    queries: policyIds.map((policyId) => ({
      queryKey: policyKeys.byId(policyId),
      queryFn: async () => {
        // Check cache first
        const cached = queryClient.getQueryData(policyKeys.byId(policyId));
        if (cached) {
          return cached;
        }
        
        // Fetch from API and convert using adapter
        const metadata = await fetchPolicyById(country, policyId);
        return PolicyAdapter.fromMetadata(metadata);
      },
      enabled: !!policyAssociations,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })),
  });

  // Combine loading and error states
  const isLoading = associationsLoading || policyQueries.some((q) => q.isLoading);
  const error = associationsError || policyQueries.find((q) => q.error)?.error || null;

  // Build the denormalized data structure for normalization
  const denormalizedData = policyAssociations?.map((association, index) => {
    const policy = policyQueries[index]?.data;
    
    return {
      id: association.policyId,
      ...association,
      policy: policy || undefined,
    };
  }) ?? [];

  // Normalize the data
  let normalizedData: NormalizedPolicyData = {
    entities: {},
    result: [],
    isLoading,
    error: error as Error | null,
  };

  if (!isLoading && !error && denormalizedData.length > 0) {
    const normalized = normalize(denormalizedData, [userPolicySchema]);
    normalizedData = {
      ...normalized,
      isLoading,
      error: null,
    };
  }

  return {
    ...normalizedData,
    // Helper functions to denormalize specific entities
    getPolicy: (id: string) => {
      if (!normalizedData.entities.policies?.[id]) return null;
      return denormalize(id, policySchema, normalizedData.entities);
    },
    getUserPolicy: (id: string) => {
      if (!normalizedData.entities.userPolicies?.[id]) return null;
      return denormalize(id, userPolicySchema, normalizedData.entities);
    },
    // Get all policies as an array
    getAllPolicies: () => {
      const policies = normalizedData.entities.policies;
      if (!policies) return [];
      return Object.keys(policies).map(id => policies[id]);
    },
    // Get all user policies as an array
    getAllUserPolicies: () => {
      const userPolicies = normalizedData.entities.userPolicies;
      if (!userPolicies) return [];
      return Object.keys(userPolicies).map(id => userPolicies[id]);
    },
    // Search policies by label
    searchPoliciesByLabel: (searchTerm: string) => {
      const userPolicies = normalizedData.entities.userPolicies;
      if (!userPolicies) return [];
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      return Object.values(userPolicies).filter((userPolicy: any) => 
        userPolicy.label?.toLowerCase().includes(lowerSearchTerm)
      );
    },
  };
};

/**
 * Hook to fetch a single user policy with its base policy data
 */
export const useUserPolicyNormalized = (userId: string, policyId: string) => {
  const allPolicies = useUserPoliciesNormalized(userId);
  
  return {
    ...allPolicies,
    data: allPolicies.getUserPolicy(policyId),
    policy: allPolicies.getPolicy(policyId),
  };
};