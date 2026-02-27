import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { PolicyAdapter } from '@/adapters';
import { fetchPolicyById } from '@/api/policy';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserId } from '@/hooks/useUserId';
import { isV2EntityId } from '@/hooks/utils/normalizedUtils';
import { getStoreBackend } from '@/libs/storeBackend';
import { Policy } from '@/types/ingredients/Policy';
import { ApiPolicyStore, LocalStoragePolicyStore } from '../api/policyAssociation';
import { queryConfig } from '../libs/queryConfig';
import { policyAssociationKeys, policyKeys } from '../libs/queryKeys';
import { UserPolicy } from '../types/ingredients/UserPolicy';

const apiPolicyStore = new ApiPolicyStore();
const localPolicyStore = new LocalStoragePolicyStore();

export const useUserPolicyStore = () => {
  const backend = getStoreBackend();
  return backend === 'api' ? apiPolicyStore : localPolicyStore;
};

// This fetches only the user-policy associations; see
// 'useUserPolicies' below to also fetch full policy details
export const usePolicyAssociationsByUser = (userId: string) => {
  const store = useUserPolicyStore();
  const countryId = useCurrentCountry();
  const backend = getStoreBackend();
  const config = backend === 'api' ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: policyAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    enabled: !!countryId,
    ...config,
  });
};

export const usePolicyAssociation = (userPolicyId: string) => {
  const store = useUserPolicyStore();
  const backend = getStoreBackend();
  const config = backend === 'api' ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: policyAssociationKeys.byId(userPolicyId),
    queryFn: () => store.findById(userPolicyId),
    enabled: !!userPolicyId,
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
        queryKey: policyAssociationKeys.byUser(newAssociation.userId, newAssociation.countryId),
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

export const useUpdatePolicyAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: ({
      userPolicyId,
      updates,
    }: {
      userPolicyId: string;
      updates: Partial<UserPolicy>;
    }) => store.update(userPolicyId, updates, userId),

    onSuccess: (updatedAssociation) => {
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

export const useDeletePolicyAssociation = () => {
  const store = useUserPolicyStore();
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: ({ userPolicyId, policyId }: { userPolicyId: string; policyId: string }) =>
      store.delete(userPolicyId, userId).then(() => ({ policyId })),
    onSuccess: (_, { userPolicyId, policyId }) => {
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: policyAssociationKeys.byPolicy(policyId) });

      queryClient.setQueryData(policyAssociationKeys.specific(userId, policyId), null);
      queryClient.removeQueries({ queryKey: policyAssociationKeys.byId(userPolicyId) });
    },
  });
};

// Type for the combined data structure
export interface UserPolicyWithAssociation {
  association: UserPolicy;
  policy: Policy | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  isError?: boolean;
}

export function isPolicyWithAssociation(obj: unknown): obj is UserPolicyWithAssociation {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'association' in obj &&
    'policy' in obj &&
    ((obj as UserPolicyWithAssociation).policy === undefined ||
      typeof (obj as UserPolicyWithAssociation).policy === 'object') &&
    typeof (obj as UserPolicyWithAssociation).isLoading === 'boolean' &&
    ('error' in obj
      ? (obj as UserPolicyWithAssociation).error === null ||
        (obj as UserPolicyWithAssociation).error instanceof Error
      : true)
  );
}

export const useUserPolicies = (userId: string) => {
  // First, get the associations (now filtered by countryId in both API and localStorage)
  const {
    data: associations,
    isLoading: associationsLoading,
    error: associationsError,
  } = usePolicyAssociationsByUser(userId);

  // Extract policy IDs — only fetch v2 (UUID) IDs from v2 API
  // V1 integer IDs (e.g. "2" for current law) can't be resolved via v2 API
  const policyIds = (associations?.map((a) => a.policyId) ?? []).filter(isV2EntityId);

  // Fetch all policies in parallel and transform to internal Policy type
  // This ensures cache consistency with useUserReports and useUserSimulations
  const policyQueries = useQueries({
    queries: policyIds.map((policyId) => ({
      queryKey: policyKeys.byId(policyId),
      queryFn: async () => {
        try {
          const response = await fetchPolicyById(policyId);
          return PolicyAdapter.fromV2Response(response);
        } catch (error) {
          // Add context to help debug which policy failed
          const message =
            error instanceof Error
              ? `Failed to load policy ${policyId}: ${error.message}`
              : `Failed to load policy ${policyId}`;
          console.error(`[useUserPolicies] ${message}`, error);
          throw new Error(message);
        }
      },
      enabled: !!associations, // Only run when associations are loaded
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Combine the results
  const isLoading = associationsLoading || policyQueries.some((q) => q.isLoading);
  const error = associationsError || policyQueries.find((q) => q.error)?.error;
  const isError = !!error;

  // Simple index-based mapping since queries are in same order as associations
  // No post-fetch filter needed - both API and localStorage now filter by countryId
  const policiesWithAssociations: UserPolicyWithAssociation[] | undefined = associations?.map(
    (association, index) => ({
      association,
      policy: policyQueries[index]?.data,
      isLoading: policyQueries[index]?.isLoading ?? false,
      error: policyQueries[index]?.error ?? null,
      isError: !!error,
    })
  );

  return {
    data: policiesWithAssociations,
    isLoading,
    isError,
    error,
    associations, // Still available if needed separately
  };
};
