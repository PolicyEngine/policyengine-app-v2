import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiGeographicStore, SessionStorageGeographicStore } from '@/api/geographicAssociation';
import { queryConfig } from '@/libs/queryConfig';
import { geographicAssociationKeys } from '@/libs/queryKeys';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { Geography } from '@/types/ingredients/Geography';

const apiGeographicStore = new ApiGeographicStore();
const sessionGeographicStore = new SessionStorageGeographicStore();

export const useUserGeographicStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiGeographicStore : sessionGeographicStore;
};

// This fetches only the user-geographic associations
export const useGeographicAssociationsByUser = (userId: string) => {
  const store = useUserGeographicStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: geographicAssociationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const useGeographicAssociation = (userId: string, geographyId: string) => {
  const store = useUserGeographicStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: geographicAssociationKeys.specific(userId, geographyId),
    queryFn: () => store.findById(userId, geographyId),
    ...config,
  });
};

export const useCreateGeographicAssociation = () => {
  const store = useUserGeographicStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (population: Omit<UserGeographyPopulation, 'createdAt' | 'type'>) =>
      store.create({ ...population, type: 'geography' as const }),
    onSuccess: (newPopulation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byUser(newPopulation.userId),
      });
      queryClient.invalidateQueries({
        queryKey: geographicAssociationKeys.byGeography(newPopulation.geographyId),
      });

      // Update specific query cache
      queryClient.setQueryData(
        geographicAssociationKeys.specific(
          newPopulation.userId,
          newPopulation.geographyId
        ),
        newPopulation
      );
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
  // First, get the populations
  const {
    data: populations,
    isLoading: populationsLoading,
    error: populationsError,
  } = useGeographicAssociationsByUser(userId);

  // For geographic populations, we construct Geography objects from the population data
  // since they don't require API fetching like households do
  const geographicsWithAssociations: UserGeographicMetadataWithAssociation[] | undefined =
    populations?.map((population) => {
      // Construct a Geography object from the population data
      const geography: Geography = {
        id: population.geographyId,
        countryId: population.countryId,
        scope: population.scope,
        geographyId: population.geographyId,
        name: population.label,
      };

      return {
        association: population,
        geography,
        isLoading: false,
        error: null,
        isError: false,
      };
    });

  return {
    data: geographicsWithAssociations,
    isLoading: populationsLoading,
    isError: !!populationsError,
    error: populationsError,
    associations: populations, // Still available if needed separately
  };
}
