import { fetchPolicyById } from '@/api/policy';
import { PolicyAdapter } from '@/adapters';
import { policySchema, userPolicySchema } from '@/schemas/ingredientSchemas';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { policyKeys } from '../libs/queryKeys';
import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  NormalizedData,
  useParallelQueries,
  normalizeData,
  createDenormalizer,
  createBatchDenormalizer,
  createSearchFunction,
  combineLoadingStates,
} from './utils/normalizedUtils';

interface PolicyNormalizedData extends NormalizedData {
  entities: {
    policies?: Record<string, Policy>;
    userPolicies?: Record<string, UserPolicy>;
  };
}

/**
 * Enhanced hook that fetches user policies and returns normalized data for easy access by ID
 * Implements intelligent caching to avoid redundant API calls
 */
export const useUserPoliciesNormalized = (userId: string) => {
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic

  // Fetch user-policy associations
  const {
    data: policyAssociations,
    isLoading: associationsLoading,
    error: associationsError,
  } = usePolicyAssociationsByUser(userId);

  // Extract policy IDs
  const policyIds = policyAssociations?.map((a) => a.policyId) ?? [];

  // Fetch all policies in parallel with caching
  const { queries: policyQueries, isLoading: policiesLoading, error: policiesError } = 
    useParallelQueries<Policy>(policyIds.map(id => id.toString()), {
      queryKey: policyKeys.byId,
      queryFn: async (policyId) => {
        const metadata = await fetchPolicyById(country, policyId);
        return PolicyAdapter.fromMetadata(metadata);
      },
      enabled: !!policyAssociations,
    });

  // Combine loading and error states
  const { isLoading, error } = combineLoadingStates(
    { isLoading: associationsLoading, error: associationsError },
    { isLoading: policiesLoading, error: policiesError }
  );

  // Build denormalized data structure
  const denormalizedData = policyAssociations?.map((association, index) => {
    const policy = policyQueries[index]?.data;
    
    return {
      id: association.policyId,
      ...association,
      policy: policy || undefined,
    };
  }) ?? [];

  // Normalize the data
  const normalizedData = normalizeData<any>(
    denormalizedData,
    [userPolicySchema],
    isLoading,
    error
  ) as PolicyNormalizedData;

  // Create helper functions
  const getPolicy = createDenormalizer<Policy>('policies', policySchema);
  const getUserPolicy = createDenormalizer<UserPolicy>('userPolicies', userPolicySchema);
  const getAllPolicies = createBatchDenormalizer<Policy>('policies');
  const getAllUserPolicies = createBatchDenormalizer<UserPolicy>('userPolicies');
  const searchPoliciesByLabel = createSearchFunction<UserPolicy>('userPolicies', 'label');

  return {
    ...normalizedData,
    // Helper functions using the normalized entities
    getPolicy: (id: string) => getPolicy(id, normalizedData.entities),
    getUserPolicy: (id: string) => getUserPolicy(id, normalizedData.entities),
    getAllPolicies: () => getAllPolicies(normalizedData.entities),
    getAllUserPolicies: () => getAllUserPolicies(normalizedData.entities),
    searchPoliciesByLabel: (searchTerm: string) => 
      searchPoliciesByLabel(normalizedData.entities, searchTerm),
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