// Import auth hook here in future; for now, mocked out below
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchPolicyById } from '@/api/policy';
import { RootState } from '@/store';
import { PolicyMetadata } from '@/types/policyMetadata';
import { ApiPolicyStore, SessionStoragePolicyStore } from '../api/policyAssociation';
import { queryConfig } from '../libs/queryConfig';
import { policyAssociationKeys, policyKeys } from '../libs/queryKeys';
import { UserPolicyAssociation } from '../types/userIngredientAssociations';

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
    queryKey: policyAssociationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const usePolicyAssociation = (userId: string, policyId: string) => {
  const store = useUserPolicyStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: policyAssociationKeys.specific(userId, policyId),
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
      queryClient.invalidateQueries({
        queryKey: policyAssociationKeys.byUser(newAssociation.userId),
      });
      queryClient.invalidateQueries({
        queryKey: policyAssociationKeys.byPolicy(newAssociation.policyId),
      });

      // Update specific query cache
      queryClient.setQueryData(
        policyAssociationKeys.specific(newAssociation.userId, newAssociation.policyId),
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
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byUser(updatedAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byPolicy(updatedAssociation.policyId) });

      queryClient.setQueryData(
        policyAssociationKeys.specific(updatedAssociation.userId, updatedAssociation.policyId),
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
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byPolicy(policyId) });

      queryClient.setQueryData(
        policyAssociationKeys.specific(userId, policyId),
        null
      );
    },
  });
};
*/

// Type for the combined data structure
interface UserPolicyMetadataWithAssociation {
  association: UserPolicyAssociation;
  policy: PolicyMetadata | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
}

export const useUserPolicies = (userId: string) => {
  // Get country from metadata state, fallback to 'us' if not available
  const country = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

  // First, get the associations
  const {
    data: associations,
    isLoading: associationsLoading,
    error: associationsError,
  } = usePolicyAssociationsByUser(userId);

  // Extract policy IDs
  const policyIds = associations?.map((a) => a.policyId) ?? [];

  // Fetch all policies in parallel
  const policyQueries = useQueries({
    queries: policyIds.map((policyId) => ({
      queryKey: policyKeys.byId(policyId),
      queryFn: () => fetchPolicyById(country, policyId),
      enabled: !!associations, // Only run when associations are loaded
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Combine the results
  const isLoading = associationsLoading || policyQueries.some((q) => q.isLoading);
  const error = associationsError || policyQueries.find((q) => q.error)?.error;
  const isError = !!error;

  // Simple index-based mapping since queries are in same order as associations
  const policiesWithAssociations: UserPolicyMetadataWithAssociation[] | undefined =
    associations?.map((association, index) => ({
      association,
      policy: policyQueries[index]?.data,
      isLoading: policyQueries[index]?.isLoading ?? false,
      error: policyQueries[index]?.error ?? null,
      isError: !!error,
    }));

  return {
    data: policiesWithAssociations,
    isLoading,
    isError,
    error,
    associations, // Still available if needed separately
  };
};
