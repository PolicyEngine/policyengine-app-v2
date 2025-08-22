// Import auth hook here in future; for now, mocked out below
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchSimulationById } from '@/api/simulation';
import { countryIds } from '@/libs/countries';
import { RootState } from '@/store';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { ApiSimulationStore, SessionStorageSimulationStore } from '../api/simulationAssociation';
import { queryConfig } from '../libs/queryConfig';
import { simulationAssociationKeys, simulationKeys } from '../libs/queryKeys';
import { UserSimulation } from '../types/ingredients/UserSimulation';

const apiSimulationStore = new ApiSimulationStore();
const sessionSimulationStore = new SessionStorageSimulationStore();

export const useUserSimulationStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiSimulationStore : sessionSimulationStore;
};

/**
 * Lightweight hook that fetches only the user-simulation associations
 * 
 * Use this hook when you need:
 * - Just the list of user's simulations (IDs and labels)
 * - Simulation counts or simple lists
 * - Navigation menus or sidebars
 * 
 * For full simulation data with policies and households, use useUserSimulations
 */
export const useSimulationAssociationsByUser = (userId: string) => {
  const store = useUserSimulationStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: simulationAssociationKeys.byUser(userId),
    queryFn: () => store.findByUser(userId),
    ...config,
  });
};

export const useSimulationAssociation = (userId: string, simulationId: string) => {
  const store = useUserSimulationStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.sessionStorage;

  return useQuery({
    queryKey: simulationAssociationKeys.specific(userId, simulationId),
    queryFn: () => store.findById(userId, simulationId),
    ...config,
  });
};

export const useCreateSimulationAssociation = () => {
  const store = useUserSimulationStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userSimulation: Omit<UserSimulation, 'id' | 'createdAt'>) =>
      store.create(userSimulation),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: simulationAssociationKeys.byUser(newAssociation.userId.toString()),
      });
      queryClient.invalidateQueries({
        queryKey: simulationAssociationKeys.bySimulation(newAssociation.simulationId.toString()),
      });

      // Update specific query cache
      queryClient.setQueryData(
        simulationAssociationKeys.specific(newAssociation.userId.toString(), newAssociation.simulationId.toString()),
        newAssociation
      );
    },
  });
};

// Not yet implemented, but keeping for future use
/*
export const useUpdateAssociation = () => {
  const store = useUserSimulationStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, simulationId, updates }: {
      userId: string;
      simulationId: string;
      updates: Partial<UserSimulation>;
    }) => store.update(userId, simulationId, updates),
    onSuccess: (updatedAssociation) => {
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.byUser(updatedAssociation.userId) });
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.bySimulation(updatedAssociation.simulationId) });
      
      queryClient.setQueryData(
        simulationAssociationKeys.specific(updatedAssociation.userId, updatedAssociation.simulationId),
        updatedAssociation
      );
    },
  });
};
*/

// Not yet implemented, but keeping for future use
/*
export const useDeleteAssociation = () => {
  const store = useUserSimulationStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, simulationId }: { userId: string; simulationId: string }) =>
      store.delete(userId, simulationId),
    onSuccess: (_, { userId, simulationId }) => {
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.bySimulation(simulationId) });
      
      queryClient.setQueryData(
        simulationAssociationKeys.specific(userId, simulationId),
        null
      );
    },
  });
};
*/

// TODO: Verify that useUserSimulations is valid code
// Type for the combined data structure
interface UserSimulationMetadataWithAssociation {
  association: UserSimulation;
  simulation: SimulationMetadata | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
}

export const useUserSimulations = (userId: string) => {
  // Get country from metadata state, fallback to 'us' if not available
  const metadataCountry = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';
  // Ensure country is a valid country ID, fallback to 'us' if not recognized
  const country = countryIds.includes(metadataCountry as any)
    ? (metadataCountry as (typeof countryIds)[number])
    : 'us';

  // First, get the associations
  const {
    data: associations,
    isLoading: associationsLoading,
    error: associationsError,
  } = useSimulationAssociationsByUser(userId);

  // Extract simulation IDs
  const simulationIds = associations?.map((a) => a.simulationId) ?? [];

  // Fetch all policies in parallel
  const simulationQueries = useQueries({
    queries: simulationIds.map((simulationId) => ({
      queryKey: simulationKeys.byId(simulationId.toString()),
      queryFn: () => fetchSimulationById(country, simulationId.toString()),
      enabled: !!associations, // Only run when associations are loaded
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Combine the results
  const isLoading = associationsLoading || simulationQueries.some((q) => q.isLoading);
  const error = associationsError || simulationQueries.find((q) => q.error)?.error;
  const isError = !!error;

  // Simple index-based mapping since queries are in same order as associations
  const policiesWithAssociations: UserSimulationMetadataWithAssociation[] | undefined =
    associations?.map((association, index) => ({
      association,
      simulation: simulationQueries[index]?.data,
      isLoading: simulationQueries[index]?.isLoading ?? false,
      error: simulationQueries[index]?.error ?? null,
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
/**
 * @deprecated Use useUserSimulations from './useUserSimulations' for full data,
 * or useSimulationAssociationsByUser for just associations
 */
// This function has been moved to its own file as the primary useUserSimulations hook
