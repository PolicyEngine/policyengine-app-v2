// Import auth hook here in future; for now, mocked out below
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchHouseholdById } from '@/api/household';
import type { UserHouseholdStore } from '@/api/householdAssociation';
import {
  assertSupportedMode,
  getSupportedMigrationModes,
  usesV2ShadowMode,
} from '@/config/migrationMode';
import { replaceHouseholdBaseForAssociation as replaceHouseholdBaseForAssociationAction } from '@/hooks/household/replaceHouseholdBaseForAssociation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  shadowCreateUserHouseholdAssociation,
  shadowUpdateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { Household } from '@/models/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { ApiHouseholdStore, LocalStorageHouseholdStore } from '../api/householdAssociation';
import { queryConfig } from '../libs/queryConfig';
import { householdAssociationKeys, householdKeys } from '../libs/queryKeys';

const apiHouseholdStore = new ApiHouseholdStore();
const localHouseholdStore = new LocalStorageHouseholdStore();

type HouseholdAssociationStoreSelection = {
  store: ApiHouseholdStore | LocalStorageHouseholdStore;
  config: typeof queryConfig.api | typeof queryConfig.localStorage;
};

type HouseholdWriteConfigOptions = {
  skipDuplicateV2AssociationShadow?: boolean;
};

export function getHouseholdWriteConfig(
  context: string,
  options?: HouseholdWriteConfigOptions
): { shouldShadowV2: boolean } {
  const mode = assertSupportedMode('households', getSupportedMigrationModes('households'), context);

  return {
    shouldShadowV2: usesV2ShadowMode(mode) && !options?.skipDuplicateV2AssociationShadow,
  };
}

export const useUserHouseholdStore = () => {
  return useHouseholdAssociationStoreForMode().store;
};

export const useHouseholdAssociationStoreForMode = (): HouseholdAssociationStoreSelection => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return {
    store: isLoggedIn ? apiHouseholdStore : localHouseholdStore,
    config: isLoggedIn ? queryConfig.api : queryConfig.localStorage,
  };
};

// This fetches only the user-household associations; see
// 'useUserHouseholds' below to also fetch full household details
export const useHouseholdAssociationsByUser = (userId: string) => {
  const { store, config } = useHouseholdAssociationStoreForMode();
  const countryId = useCurrentCountry();

  return useQuery({
    queryKey: householdAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const useHouseholdAssociation = (userId: string, householdId: string) => {
  const { store, config } = useHouseholdAssociationStoreForMode();

  return useQuery({
    queryKey: householdAssociationKeys.specific(userId, householdId),
    queryFn: () => store.findById(userId, householdId),
    ...config,
  });
};

export const useCreateHouseholdAssociation = (options?: HouseholdWriteConfigOptions) => {
  const { store } = useHouseholdAssociationStoreForMode();
  const queryClient = useQueryClient();
  const { shouldShadowV2 } = getHouseholdWriteConfig('useCreateHouseholdAssociation', options);

  return useMutation({
    mutationFn: (household: Omit<UserHouseholdPopulation, 'createdAt' | 'type'>) => {
      return store.create({ ...household, type: 'household' as const });
    },
    onSuccess: (newAssociation) => {
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

      if (shouldShadowV2) {
        void shadowCreateUserHouseholdAssociation(newAssociation);
      }
    },
  });
};

export async function replaceHouseholdBaseForAssociation(args: {
  association: UserHouseholdPopulation;
  nextHousehold: Household;
  store?: Pick<UserHouseholdStore, 'update'>;
  shouldShadowV2?: boolean;
}): Promise<UserHouseholdPopulation> {
  return replaceHouseholdBaseForAssociationAction({
    ...args,
    store: args.store ?? localHouseholdStore,
  });
}

export const useUpdateHouseholdAssociation = () => {
  const { store } = useHouseholdAssociationStoreForMode();
  const queryClient = useQueryClient();
  const { shouldShadowV2 } = getHouseholdWriteConfig('useUpdateHouseholdAssociation');

  return useMutation({
    mutationFn: async ({
      userHouseholdId,
      updates,
      association,
      nextHousehold,
    }: {
      userHouseholdId: string;
      updates: Partial<UserHouseholdPopulation>;
      association?: UserHouseholdPopulation;
      nextHousehold?: Household;
    }) => {
      if (nextHousehold) {
        if (!association) {
          throw new Error('Association is required when replacing a household base');
        }

        return replaceHouseholdBaseForAssociation({
          association,
          nextHousehold,
          store,
          shouldShadowV2,
        });
      }

      return store.update(userHouseholdId, updates);
    },

    onSuccess: (updatedAssociation, variables) => {
      const previousHouseholdId =
        variables.association?.householdId ?? updatedAssociation.householdId;

      // Invalidate all related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byUser(
          updatedAssociation.userId,
          updatedAssociation.countryId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: householdAssociationKeys.byHousehold(previousHouseholdId),
      });
      if (previousHouseholdId !== updatedAssociation.householdId) {
        queryClient.invalidateQueries({
          queryKey: householdAssociationKeys.byHousehold(updatedAssociation.householdId),
        });
      }

      // Optimistically update caches
      queryClient.setQueryData(
        householdAssociationKeys.specific(
          updatedAssociation.userId,
          updatedAssociation.householdId
        ),
        updatedAssociation
      );

      if (previousHouseholdId !== updatedAssociation.householdId) {
        queryClient.removeQueries({
          queryKey: householdAssociationKeys.specific(
            updatedAssociation.userId,
            previousHouseholdId
          ),
          exact: true,
        });
      }

      if (!variables.nextHousehold && shouldShadowV2) {
        void shadowUpdateUserHouseholdAssociation(updatedAssociation);
      }
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
  household: Household | undefined;
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

  // Extract household IDs
  const householdIds = associations?.map((a) => a.householdId) ?? [];

  // Fetch all households in parallel
  const householdQueries = useQueries({
    queries: householdIds.map((householdId) => ({
      queryKey: householdKeys.byId(householdId),
      queryFn: async () => {
        const metadata = await fetchHouseholdById(country, householdId);
        return Household.fromV1Metadata(metadata);
      },
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
      .map((association, index) => {
        const queryResult = householdQueries[index];

        return {
          association,
          household: queryResult?.data,
          isLoading: queryResult?.isLoading ?? false,
          error: queryResult?.error ?? null,
          isError: !!queryResult?.error,
        };
      });

  return {
    data: householdsWithAssociations,
    isLoading,
    isError,
    error,
    associations, // Still available if needed separately
  };
};
