// Import auth hook here in future; for now, mocked out below
import { ApiPolicyStore, SessionStoragePolicyStore } from '../api/policyAssociation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { associationKeys } from '../libs/queryKeys';
import { queryConfig } from '../libs/queryConfig';
import { UserPolicyAssociation } from '../types/userIngredientAssociations';

const apiPolicyStore = new ApiPolicyStore();
const sessionPolicyStore = new SessionStoragePolicyStore();

export const useUserPolicyStore = () => {
  const isLoggedIn = false; // Replace with actual auth check in future
  return isLoggedIn ? apiPolicyStore : sessionPolicyStore;
};

export const usePolicyAssociationsByUser = (userId: string) => {
  const store = useUserPolicyStore();
  const isLoggedIn = false; // Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: associationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const usePolicyAssociation = (userId: string, policyId: string) => {
  const store = useUserPolicyStore();
  const isLoggedIn = false; // Replace with actual auth check in future
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