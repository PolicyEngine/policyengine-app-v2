import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { ApiGeographicStore, SessionStorageGeographicStore } from '@/api/geographicAssociation';
import { queryConfig } from '@/libs/queryConfig';
import { geographicAssociationKeys } from '@/libs/queryKeys';
import { RootState } from '@/store';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { Geography } from '@/types/ingredients/Geography';
import { getCountryLabel } from '@/utils/geographyUtils';

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
  // Get metadata for label lookups
  const metadata = useSelector((state: RootState) => state.metadata);
  
  // First, get the populations
  const {
    data: populations,
    isLoading: populationsLoading,
    error: populationsError,
  } = useGeographicAssociationsByUser(userId);

  // Helper function to get proper label from metadata or fallback
  const getGeographyName = (population: UserGeographyPopulation): string => {
    // If label exists, use it
    if (population.label) {
      return population.label;
    }
    
    // For national scope, use country name
    if (population.scope === 'national') {
      return getCountryLabel(population.countryId);
    }
    
    // For subnational, look up in metadata
    if (metadata.economyOptions?.region) {
      const region = metadata.economyOptions.region.find(
        (r) => r.name === population.geographyId ||
               r.name === `state/${population.geographyId}` ||
               r.name === `constituency/${population.geographyId}`
      );
      if (region?.label) {
        return region.label;
      }
    }
    
    // Fallback to geography ID
    return population.geographyId;
  };

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
        name: getGeographyName(population),
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
