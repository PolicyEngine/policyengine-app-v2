// Import auth hook here in future; for now, mocked out below
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPolicyById } from '@/api/policy';
import { useCurrentCountry } from '@policyengine/shared';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { ApiPolicyStore, LocalStoragePolicyStore } from '../api/policyAssociation';
import { queryConfig } from '../libs/queryConfig';
import { policyAssociationKeys, policyKeys } from '../libs/queryKeys';
import { UserPolicy } from '../types/ingredients/UserPolicy';

const apiPolicyStore = new ApiPolicyStore();
const localPolicyStore = new LocalStoragePolicyStore();

export const useUserPolicyStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiPolicyStore : localPolicyStore;
};

// This fetches only the user-policy associations; see
// 'useUserPolicies' below to also fetch full policy details
export const usePolicyAssociationsByUser = (userId: string) => {
  const store = useUserPolicyStore();
  const countryId = useCurrentCountry();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: policyAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const usePolicyAssociation = (userId: string, policyId: string) => {
  const store = useUserPolicyStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

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
    mutationFn: (userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>) => store.create(userPolicy),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: policyAssociationKeys.byUser(
          newAssociation.userId.toString(),
          newAssociation.countryId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: policyAssociationKeys.byPolicy(newAssociation.policyId.toString()),
      });

      // Update specific query cache
      queryClient.setQueryData(
        policyAssociationKeys.specific(
          newAssociation.userId.toString(),
          newAssociation.policyId.toString()
        ),
        newAssociation
      );
    },
  });
};

export const useUpdatePolicyAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userPolicyId,
      updates,
    }: {
      userPolicyId: string;
      updates: Partial<UserPolicy>;
    }) => store.update(userPolicyId, updates),

    onSuccess: (updatedAssociation) => {
      // Invalidate all related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: policyAssociationKeys.byUser(
          updatedAssociation.userId,
          updatedAssociation.countryId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: policyAssociationKeys.byPolicy(updatedAssociation.policyId),
      });

      // Optimistically update caches
      queryClient.setQueryData(
        policyAssociationKeys.specific(updatedAssociation.userId, updatedAssociation.policyId),
        updatedAssociation
      );
    },
  });
};

// Not yet implemented, but keeping for future use
/*
export const useDeleteAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, policyId }: { userId: string; policyId: string; countryId?: string }) =>
      store.delete(userId, policyId),
    onSuccess: (_, { userId, policyId, countryId }) => {
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byUser(userId, countryId) });
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
export interface UserPolicyMetadataWithAssociation {
  association: UserPolicy;
  policy: PolicyMetadata | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  isError?: boolean;
}

export function isPolicyMetadataWithAssociation(
  obj: any
): obj is UserPolicyMetadataWithAssociation {
  return (
    obj &&
    typeof obj === 'object' &&
    'association' in obj &&
    'policy' in obj &&
    (obj.policy === undefined || typeof obj.policy === 'object') &&
    typeof obj.isLoading === 'boolean' &&
    ('error' in obj ? obj.error === null || obj.error instanceof Error : true)
  );
}

export const useUserPolicies = (userId: string) => {
  const country = useCurrentCountry();

  // First, get the associations (filtered by current country)
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
      queryKey: policyKeys.byId(policyId.toString()),
      queryFn: () => fetchPolicyById(country, policyId.toString()),
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
