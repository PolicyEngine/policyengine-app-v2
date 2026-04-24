// Import auth hook here in future; for now, mocked out below
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assertSupportedSimulationCapabilityMode,
  isSimulationCapabilityV1Only,
} from '@/config/simulationCapability';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  ApiSimulationStore,
  LocalStorageSimulationStore,
  MixedSimulationStore,
} from '../api/simulationAssociation';
import { queryConfig } from '../libs/queryConfig';
import { simulationAssociationKeys } from '../libs/queryKeys';
import { UserSimulation } from '../types/ingredients/UserSimulation';

const apiSimulationStore = new ApiSimulationStore();
const localSimulationStore = new LocalStorageSimulationStore();
const mixedSimulationStore = new MixedSimulationStore(localSimulationStore, apiSimulationStore);

type SimulationAssociationStoreSelection = {
  store: ApiSimulationStore | LocalStorageSimulationStore | MixedSimulationStore;
  config: typeof queryConfig.api | typeof queryConfig.localStorage;
};

export const useUserSimulationStore = () => {
  return useSimulationAssociationStoreForCapability().store;
};

export const useSimulationAssociationStoreForCapability =
  (): SimulationAssociationStoreSelection => {
    const mode = assertSupportedSimulationCapabilityMode(
      'associations',
      ['v1_only', 'mixed', 'v2_enabled'],
      'useSimulationAssociationStoreForCapability'
    );

    if (isSimulationCapabilityV1Only('associations')) {
      return {
        store: localSimulationStore,
        config: queryConfig.localStorage,
      };
    }

    if (mode === 'mixed') {
      return {
        store: mixedSimulationStore,
        config: queryConfig.api,
      };
    }

    return {
      store: apiSimulationStore,
      config: queryConfig.api,
    };
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
  const { store, config } = useSimulationAssociationStoreForCapability();
  const countryId = useCurrentCountry();

  return useQuery({
    queryKey: simulationAssociationKeys.byUser(userId, countryId),
    queryFn: () => store.findByUser(userId, countryId),
    ...config,
  });
};

export const useSimulationAssociation = (userId: string, simulationId: string) => {
  const { store, config } = useSimulationAssociationStoreForCapability();

  return useQuery({
    queryKey: simulationAssociationKeys.specific(userId, simulationId),
    queryFn: () => store.findById(userId, simulationId),
    ...config,
  });
};

export const useCreateSimulationAssociation = () => {
  const { store } = useSimulationAssociationStoreForCapability();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userSimulation: Omit<UserSimulation, 'id' | 'createdAt'>) =>
      store.create(userSimulation),
    onSuccess: (newAssociation) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: simulationAssociationKeys.byUser(
          newAssociation.userId.toString(),
          newAssociation.countryId
        ),
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

export const useUpdateSimulationAssociation = () => {
  const { store } = useSimulationAssociationStoreForCapability();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userSimulationId,
      updates,
    }: {
      userSimulationId: string;
      updates: Partial<UserSimulation>;
    }) => store.update(userSimulationId, updates),

    onSuccess: (updatedAssociation) => {
      // Invalidate all related queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: simulationAssociationKeys.byUser(
          updatedAssociation.userId,
          updatedAssociation.countryId
        ),
      });

      queryClient.invalidateQueries({
        queryKey: simulationAssociationKeys.bySimulation(updatedAssociation.simulationId),
      });

      // Optimistically update caches
      queryClient.setQueryData(
        simulationAssociationKeys.specific(
          updatedAssociation.userId,
          updatedAssociation.simulationId
        ),
        updatedAssociation
      );
    },
  });
};

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
