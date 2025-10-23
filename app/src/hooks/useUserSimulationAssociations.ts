// Import auth hook here in future; for now, mocked out below
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { ApiSimulationStore, LocalStorageSimulationStore } from '../api/simulationAssociation';
import { queryConfig } from '../libs/queryConfig';
import { simulationAssociationKeys } from '../libs/queryKeys';
import { UserSimulation } from '../types/ingredients/UserSimulation';

const apiSimulationStore = new ApiSimulationStore();
const localSimulationStore = new LocalStorageSimulationStore();

export const useUserSimulationStore = () => {
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  return isLoggedIn ? apiSimulationStore : localSimulationStore;
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
  const countryId = useCurrentCountry();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  // TODO: Should we determine user ID from auth context here? Or pass as arg?
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

  return useQuery({
    queryKey: simulationAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const useSimulationAssociation = (userId: string, simulationId: string) => {
  const store = useUserSimulationStore();
  const isLoggedIn = false; // TODO: Replace with actual auth check in future
  const config = isLoggedIn ? queryConfig.api : queryConfig.localStorage;

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
        queryKey: simulationAssociationKeys.byUser(newAssociation.userId.toString(), newAssociation.countryId),
      });
      queryClient.invalidateQueries({
        queryKey: simulationAssociationKeys.bySimulation(newAssociation.simulationId.toString()),
      });

      // Update specific query cache
      queryClient.setQueryData(
        simulationAssociationKeys.specific(
          newAssociation.userId.toString(),
          newAssociation.simulationId.toString()
        ),
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
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.byUser(updatedAssociation.userId, updatedAssociation.countryId) });
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
    mutationFn: ({ userId, simulationId }: { userId: string; simulationId: string; countryId?: string }) =>
      store.delete(userId, simulationId),
    onSuccess: (_, { userId, simulationId, countryId }) => {
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.byUser(userId, countryId) });
      queryClient.invalidateQueries({ queryKey: simulationAssociationKeys.bySimulation(simulationId) });
      
      queryClient.setQueryData(
        simulationAssociationKeys.specific(userId, simulationId),
        null
      );
    },
  });
};
*/
