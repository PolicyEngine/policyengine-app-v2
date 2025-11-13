// Import auth hook here in future; for now, mocked out below
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchHouseholdById } from '@/api/household';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { ApiHouseholdStore, LocalStorageHouseholdStore } from '../api/householdAssociation';
import { queryConfig } from '../libs/queryConfig';
import { householdAssociationKeys, householdKeys } from '../libs/queryKeys';

const apiHouseholdStore = new ApiHouseholdStore();
const localHouseholdStore = new LocalStorageHouseholdStore();

export const useUserHouseholdStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiHouseholdStore : localHouseholdStore;
};

// This fetches only the user-household associations; see
// 'useUserHouseholds' below to also fetch full household details
export const useHouseholdAssociationsByUser = (userId: string) => {
  const store = useUserHouseholdStore();
  const countryId = useCurrentCountry();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

  console.log('userId', userId);
  console.log('store', store);
  console.log('isLoggedIn', isLoggedIn);
  console.log('config', config);

  console.log(
    'householdAssociationKeys.byUser(userId, countryId)',
    householdAssociationKeys.byUser(userId, countryId)
  );
  console.log('store.findByUser(userId, countryId)', store.findByUser(userId, countryId));

  return useQuery({
    queryKey: householdAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const useHouseholdAssociation = (userId: string, householdId: string) => {
  const store = useUserHouseholdStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

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
    mutationFn: (household: Omit<UserHouseholdPopulation, 'createdAt' | 'type'>) => {
      console.log('household in useCreateHouseholdAssociation');
      console.log(household);
      return store.create({ ...household, type: 'household' as const });
    },
    onSuccess: (newAssociation) => {
      console.log('new association');
      console.log(newAssociation);

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byUser(newAssociation.userId, newAssociation.countryId),
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

export const useUpdateHouseholdAssociation = () => {
  const store = useUserHouseholdStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userHouseholdId,
      updates,
    }: {
      userHouseholdId: string;
      updates: Partial<UserHouseholdPopulation>;
    }) => store.update(userHouseholdId, updates),

    onSuccess: (updatedAssociation) => {
      // Invalidate all related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byUser(
          updatedAssociation.userId,
          updatedAssociation.countryId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byHousehold(updatedAssociation.householdId),
      });

      // Optimistically update caches
      queryClient.setQueryData(
        householdAssociationKeys.specific(
          updatedAssociation.userId,
          updatedAssociation.householdId
        ),
        updatedAssociation
      );
    },
  });
};

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
export interface UserHouseholdMetadataWithAssociation {
  association: UserHouseholdPopulation;
  household: HouseholdMetadata | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  isError?: boolean;
}

export function isHouseholdMetadataWithAssociation(
  obj: any
): obj is UserHouseholdMetadataWithAssociation {
  return (
    obj &&
    typeof obj === 'object' &&
    'association' in obj &&
    'household' in obj &&
    (obj.household === undefined || typeof obj.household === 'object') &&
    typeof obj.isLoading === 'boolean' &&
    ('error' in obj ? obj.error === null || obj.error instanceof Error : true)
  );
}

export const useUserHouseholds = (userId: string) => {
  const country = useCurrentCountry();

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
  // TODO: Determine if this filter action is needed
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
