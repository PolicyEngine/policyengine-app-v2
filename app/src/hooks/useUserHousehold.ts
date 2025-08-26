// Import auth hook here in future; for now, mocked out below
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchHouseholdById } from '@/api/household';
import { RootState } from '@/store';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { ApiHouseholdStore, SessionStorageHouseholdStore } from '../api/householdAssociation';
import { queryConfig } from '../libs/queryConfig';
import { householdAssociationKeys, householdKeys } from '../libs/queryKeys';

const apiHouseholdStore = new ApiHouseholdStore();
const sessionHouseholdStore = new SessionStorageHouseholdStore();

export const useUserHouseholdStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiHouseholdStore : sessionHouseholdStore;
};

// This fetches only the user-household associations; see
// 'useUserHouseholds' below to also fetch full household details
export const useHouseholdAssociationsByUser = (userId: string) => {
  const store = useUserHouseholdStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  console.log('userId', userId);
  console.log('store', store);
  console.log('isLoggedIn', isLoggedIn);
  console.log('config', config);

  console.log('householdAssociationKeys.byUser(userId)', householdAssociationKeys.byUser(userId));
  console.log('store.findByUser(userId)', store.findByUser(userId));

  return useQuery({
    queryKey: householdAssociationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const useHouseholdAssociation = (userId: string, householdId: string) => {
  const store = useUserHouseholdStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: householdAssociationKeys.specific(userId, householdId),
    queryFn: () => store.findById(userId, householdId),
    ...config,
  });
};

export const useCreateHouseholdAssociation = () => {
  const store = useUserHouseholdStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (household: Omit<UserHouseholdPopulation, 'createdAt' | 'type'>) =>
      store.create({ ...household, type: 'household' as const }),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byUser(newAssociation.userId),
      });
      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byHousehold(newAssociation.householdId),
      });

      // Update specific query cache
      queryClient.setQueryData(
        householdAssociationKeys.specific(newAssociation.userId, newAssociation.householdId),
        newAssociation
      );
    },
  });
};

// Not yet implemented, but keeping for future use
/*
export const useUpdateAssociation = () => {
  const store = useUserHouseholdStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, householdId, updates }: {
      userId: string;
      householdId: string;
      updates: Partial<UserHousehold>;
    }) => store.update(userId, householdId, updates),
    onSuccess: (updatedAssociation) => {
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(updatedAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byHousehold(updatedAssociation.householdId) });
      
      queryClient.setQueryData(
        associationKeys.specific(updatedAssociation.userId, updatedAssociation.householdId),
        updatedAssociation
      );
    },
  });
};
*/

// Not yet implemented, but keeping for future use
/*
export const useDeleteAssociation = () => {
  const store = useUserHouseholdStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, householdId }: { userId: string; householdId: string }) =>
      store.delete(userId, householdId),
    onSuccess: (_, { userId, householdId }) => {
      queryClient.invalidateQueries({ queryKey: associationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: associationKeys.byHousehold(householdId) });
      
      queryClient.setQueryData(
        associationKeys.specific(userId, householdId),
        null
      );
    },
  });
};
*/

// Type for the combined data structure
interface UserHouseholdMetadataWithAssociation {
  association: UserHouseholdPopulation;
  household: HouseholdMetadata | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  isError?: boolean;
}

export const useUserHouseholds = (userId: string) => {
  // Get country from metadata state, fallback to 'us' if not available
  const country = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

  // First, get the associations
  const {
    data: associations,
    isLoading: associationsLoading,
    error: associationsError,
  } = useHouseholdAssociationsByUser(userId);

  console.log('associations', associations);

  // Extract household IDs
  const householdIds = associations?.map((a) => a.householdId) ?? [];

  console.log('householdIds', householdIds);

  // Fetch all households in parallel
  const householdQueries = useQueries({
    queries: householdIds.map((householdId) => ({
      queryKey: householdKeys.byId(householdId),
      queryFn: () => fetchHouseholdById(country, householdId),
      enabled: !!associations, // Only run when associations are loaded
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Combine the results
  const isLoading = associationsLoading || householdQueries.some((q) => q.isLoading);
  const error = associationsError || householdQueries.find((q) => q.error)?.error;
  const isError = !!error;

  // Map associations to households - filter out associations without householdId
  const householdsWithAssociations: UserHouseholdMetadataWithAssociation[] | undefined =
    associations
      ?.filter((association) => association.householdId)
      .map((association, index) => ({
        association,
        household: householdQueries[index]?.data,
        isLoading: householdQueries[index]?.isLoading ?? false,
        error: householdQueries[index]?.error ?? null,
        isError: !!householdQueries[index]?.error,
      }));

  return {
    data: householdsWithAssociations,
    isLoading,
    isError,
    error,
    associations, // Still available if needed separately
  };
};
