import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LocalStorageGeographicStore } from '@/api/geographicAssociation';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import { queryConfig } from '@/libs/queryConfig';
import { geographicAssociationKeys } from '@/libs/queryKeys';
import { buildCanonicalGeography } from '@/models/geography';
import { Geography } from '@/types/ingredients/Geography';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

const localGeographicStore = new LocalStorageGeographicStore();

/**
 * Saved geographies belong to the browser, not the account, so they are
 * always filed under the local user: signing in neither hides the ones
 * saved while signed out nor files new ones under the account's ID.
 */
const GEOGRAPHY_OWNER = MOCK_USER_ID;

type SavedGeographyAssociationStoreSelection = {
  store: LocalStorageGeographicStore;
  config: typeof queryConfig.localStorage;
};

export const useUserGeographicStore = () => {
  return useSavedGeographyAssociationStoreForMode().store;
};

// Saved geographies stay in localStorage for everyone, signed in or not:
// there is no account table for them (v3 picks from the canonical region
// list and saves the geography on the simulation instead).
export const useSavedGeographyAssociationStoreForMode =
  (): SavedGeographyAssociationStoreSelection => ({
    store: localGeographicStore,
    config: queryConfig.localStorage,
  });

// `saved_geographies` controls persisted user geography rows.
// Canonical `regions` remain a separate concern for lookup and shadow resolution.
export const useGeographicAssociationsByUser = (_userId: string) => {
  const { store, config } = useSavedGeographyAssociationStoreForMode();
  const countryId = useCurrentCountry();

  return useQuery({
    queryKey: geographicAssociationKeys.byUser(GEOGRAPHY_OWNER, countryId),
    queryFn: () => store.findByUser(GEOGRAPHY_OWNER, countryId),
    ...config,
  });
};

export const useGeographicAssociation = (_userId: string, geographyId: string) => {
  const { store, config } = useSavedGeographyAssociationStoreForMode();

  return useQuery({
    queryKey: geographicAssociationKeys.specific(GEOGRAPHY_OWNER, geographyId),
    queryFn: () => store.findById(GEOGRAPHY_OWNER, geographyId),
    ...config,
  });
};

export const useCreateGeographicAssociation = () => {
  const { store } = useSavedGeographyAssociationStoreForMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (population: Omit<UserGeographyPopulation, 'createdAt' | 'type'>) =>
      store.create({ ...population, userId: GEOGRAPHY_OWNER, type: 'geography' as const }),
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
  const { store } = useSavedGeographyAssociationStoreForMode();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      geographyId,
      updates,
    }: {
      /** Accepted for symmetry with the other stores; geographies are always local. */
      userId: string;
      geographyId: string;
      updates: Partial<UserGeographyPopulation>;
    }) => store.update(GEOGRAPHY_OWNER, geographyId, updates),

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
  const { data: regions } = useRegions(countryId);

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

  return {
    data: geographicsWithAssociations,
    isLoading: populationsLoading,
    isError: !!populationsError,
    error: populationsError,
    associations: populations, // Still available if needed separately
  };
};
