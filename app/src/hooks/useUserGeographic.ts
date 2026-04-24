import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiGeographicStore, LocalStorageGeographicStore } from '@/api/geographicAssociation';
import { assertSupportedMode } from '@/config/migrationMode';
import { useApiRegions } from '@/hooks/useApiRegions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { shadowResolveRegionTarget } from '@/libs/migration/regionShadow';
import { queryConfig } from '@/libs/queryConfig';
import { geographicAssociationKeys } from '@/libs/queryKeys';
import { buildCanonicalGeography } from '@/models/geography';
import { Geography } from '@/types/ingredients/Geography';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

const apiGeographicStore = new ApiGeographicStore();
const localGeographicStore = new LocalStorageGeographicStore();

type SavedGeographyAssociationStoreSelection = {
  store: ApiGeographicStore | LocalStorageGeographicStore;
  config: typeof queryConfig.api | typeof queryConfig.localStorage;
};

function assertSavedGeographyWriteMode(context: string): void {
  assertSupportedMode('saved_geographies', ['v1_only'], context);
}

export const useUserGeographicStore = () => {
  return useSavedGeographyAssociationStoreForMode().store;
};

export const useSavedGeographyAssociationStoreForMode =
  (): SavedGeographyAssociationStoreSelection => {
    const isLoggedIn = false; // TODO: Replace with actual auth check in future
    return {
      store: isLoggedIn ? apiGeographicStore : localGeographicStore,
      config: isLoggedIn ? queryConfig.api : queryConfig.localStorage,
    };
  };

// This fetches only the user-geographic associations
export const useGeographicAssociationsByUser = (userId: string) => {
  const { store, config } = useSavedGeographyAssociationStoreForMode();
  const countryId = useCurrentCountry();

  return useQuery({
    queryKey: geographicAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const useGeographicAssociation = (userId: string, geographyId: string) => {
  const { store, config } = useSavedGeographyAssociationStoreForMode();

  return useQuery({
    queryKey: geographicAssociationKeys.specific(userId, geographyId),
    queryFn: () => store.findById(userId, geographyId),
    ...config,
  });
};

export const useCreateGeographicAssociation = () => {
  assertSavedGeographyWriteMode('useCreateGeographicAssociation');
  const { store } = useSavedGeographyAssociationStoreForMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (population: Omit<UserGeographyPopulation, 'createdAt' | 'type'>) =>
      store.create({ ...population, type: 'geography' as const }),
    onSuccess: (newPopulation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byUser(newPopulation.userId, newPopulation.countryId),
      });
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byGeography(newPopulation.geographyId),
      });

      // Update specific query cache
      queryClient.setQueryData(
        geographicAssociationKeys.specific(newPopulation.userId, newPopulation.geographyId),
        newPopulation
      );
    },
  });
};

export const useUpdateGeographicAssociation = () => {
  assertSavedGeographyWriteMode('useUpdateGeographicAssociation');
  const { store } = useSavedGeographyAssociationStoreForMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      geographyId,
      updates,
    }: {
      userId: string;
      geographyId: string;
      updates: Partial<UserGeographyPopulation>;
    }) => store.update(userId, geographyId, updates),

    onSuccess: (updatedAssociation) => {
      // Invalidate all related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byUser(
          updatedAssociation.userId,
          updatedAssociation.countryId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byGeography(updatedAssociation.geographyId),
      });

      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.specific(
          updatedAssociation.userId,
          updatedAssociation.geographyId
        ),
      });
    },
  });
};

// Type for the combined data structure
export interface UserGeographicMetadataWithAssociation {
  association: UserGeographyPopulation;
  geography: Geography | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  isError?: boolean;
}

export function isGeographicMetadataWithAssociation(
  obj: any
): obj is UserGeographicMetadataWithAssociation {
  return (
    obj &&
    typeof obj === 'object' &&
    'association' in obj &&
    'geography' in obj &&
    (obj.geography === undefined || typeof obj.geography === 'object') &&
    typeof obj.isLoading === 'boolean' &&
    ('error' in obj ? obj.error === null || obj.error instanceof Error : true)
  );
}

export const useUserGeographics = (userId: string) => {
  const countryId = useCurrentCountry();
  const { data: regions } = useApiRegions(countryId);

  // First, get the populations
  const {
    data: populations,
    isLoading: populationsLoading,
    error: populationsError,
  } = useGeographicAssociationsByUser(userId);

  // For geographic populations, we construct Geography objects from the population data
  // since they don't require API fetching like households do
  const geographicsWithAssociations = useMemo<UserGeographicMetadataWithAssociation[] | undefined>(
    () =>
      populations?.map((population) => {
        const geography: Geography = buildCanonicalGeography({
          countryId: population.countryId,
          scope: population.scope,
          geographyId: population.geographyId,
          regions,
        });

        return {
          association: population,
          geography,
          isLoading: false,
          error: null,
          isError: false,
        };
      }),
    [populations, regions]
  );

  useEffect(() => {
    if (!geographicsWithAssociations?.length) {
      return;
    }

    void Promise.allSettled(
      geographicsWithAssociations.map(({ association, geography }) =>
        shadowResolveRegionTarget({
          countryId: association.countryId,
          regionCode: geography?.geographyId ?? association.geographyId,
          selectedLabel: geography?.name ?? null,
        })
      )
    );
  }, [geographicsWithAssociations]);

  return {
    data: geographicsWithAssociations,
    isLoading: populationsLoading,
    isError: !!populationsError,
    error: populationsError,
    associations: populations, // Still available if needed separately
  };
};
