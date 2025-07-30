// Import auth hook here in future; for now, mocked out below
import { ApiPolicyStore, SessionStoragePolicyStore } from '../api/policyAssociation';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { associationKeys, policyKeys } from '../libs/queryKeys';
import { queryConfig } from '../libs/queryConfig';
import { UserPolicyAssociation } from '../types/userIngredientAssociations';
import { usePolicy } from './usePolicy';
import { fetchPolicyById } from '@/api/policy';

const apiPolicyStore = new ApiPolicyStore();
const sessionPolicyStore = new SessionStoragePolicyStore();

export const useUserPolicyStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiPolicyStore : sessionPolicyStore;
};

// This fetches only the user-policy associations; see 
// 'useUserPolicies' below to also fetch full policy details
export const usePolicyAssociationsByUser = (userId: string) => {
  const store = useUserPolicyStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: associationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const usePolicyAssociation = (userId: string, policyId: string) => {
  const store = useUserPolicyStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: associationKeys.specific(userId, policyId),
    queryFn: () => store.findById(userId, policyId),
    ...config,
  });
};

export const useCreatePolicyAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (association: Omit<UserPolicyAssociation, 'createdAt'>) => 
      store.create(association),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(newAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byPolicy(newAssociation.policyId) });
      
      // Update specific query cache
      queryClient.setQueryData(
        associationKeys.specific(newAssociation.userId, newAssociation.policyId),
        newAssociation
      );
    },
  });
};

// Not yet implemented, but keeping for future use
/*
export const useUpdateAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, policyId, updates }: {
      userId: string;
      policyId: string;
      updates: Partial<UserPolicyAssociation>;
    }) => store.update(userId, policyId, updates),
    onSuccess: (updatedAssociation) => {
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(updatedAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byPolicy(updatedAssociation.policyId) });
      
      queryClient.setQueryData(
        associationKeys.specific(updatedAssociation.userId, updatedAssociation.policyId),
        updatedAssociation
      );
    },
  });
};
*/

// Not yet implemented, but keeping for future use
/*
export const useDeleteAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, policyId }: { userId: string; policyId: string }) =>
      store.delete(userId, policyId),
    onSuccess: (_, { userId, policyId }) => {
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byPolicy(policyId) });
      
      queryClient.setQueryData(
        associationKeys.specific(userId, policyId),
        null
      );
    },
  });
};
*/

export const useUserPolicies = (userId: string) => {
  // TODO: Create more robust way of accessing country ID
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic

  // TODO: Determine why output structure is incorrect

  // First, get the associations
  const { 
    data: associations, 
    isLoading: associationsLoading, 
    error: associationsError 
  } = usePolicyAssociationsByUser(userId);

  // Extract policy IDs
  const policyIds = associations?.map(a => a.policyId) ?? [];

  // Fetch all policies in parallel
  const policyQueries = useQueries({
    queries: policyIds.map(policyId => ({
      queryKey: policyKeys.byId(policyId), // Assuming your usePolicy uses this pattern
      queryFn: () => fetchPolicyById(country, policyId), // Your policy fetching function
      enabled: !!associations, // Only run when associations are loaded
      staleTime: 5 * 60 * 1000, // Same config as other queries
    })),
  });

  // Combine the results
  const isLoading = associationsLoading || policyQueries.some(q => q.isLoading);
  const error = associationsError || policyQueries.find(q => q.error)?.error;
  
  const policiesWithAssociations = associations?.map(association => {
    const policyQuery = policyQueries.find(q => 
      q.data?.id === association.policyId
    );
    
    return {
      association,
      policy: policyQuery?.data,
      isLoading: policyQuery?.isLoading,
      error: policyQuery?.error,
    };
  });

  console.log("policiesWithAssociations:", policiesWithAssociations);

  return {
    data: policiesWithAssociations,
    isLoading,
    error,
    associations, // Still available if needed
  };
};