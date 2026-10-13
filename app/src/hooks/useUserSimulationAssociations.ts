import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useSessionGatedQuery } from '@/hooks/utils/useSessionGatedQuery';
import { useAssociationBackend } from '@/libs/auth/useAssociationBackend';
import {
  ApiSimulationStore,
  LocalStorageSimulationStore,
  type UserSimulationStore,
} from '../api/simulationAssociation';
import { queryConfig } from '../libs/queryConfig';
import { simulationAssociationKeys } from '../libs/queryKeys';
import { UserSimulation } from '../types/ingredients/UserSimulation';

// Created on first use rather than at import, so modules (and test mocks)
// that load this hook do not construct storage eagerly.
let localSimulationStore: LocalStorageSimulationStore | null = null;
const getLocalSimulationStore = () => (localSimulationStore ??= new LocalStorageSimulationStore());

type SimulationAssociationStoreSelection = {
  store: UserSimulationStore;
  config: typeof queryConfig.api | typeof queryConfig.localStorage;
  /** False while the session is being restored; queries wait. */
  ready: boolean;
};

export const useSimulationAssociationStoreForMode = (): SimulationAssociationStoreSelection => {
  const backend = useAssociationBackend();
  return useMemo(
    () =>
      backend.mode !== 'localStorage'
        ? { store: new ApiSimulationStore(backend), config: queryConfig.api, ready: true }
        : {
            store: getLocalSimulationStore(),
            config: queryConfig.localStorage,
            ready: backend.ready,
          },
    [backend]
  );
};

export const useUserSimulationStore = () => {
  return useSimulationAssociationStoreForMode().store;
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
  const { store, config, ready } = useSimulationAssociationStoreForMode();
  const countryId = useCurrentCountry();

  return useSessionGatedQuery(
    {
      queryKey: simulationAssociationKeys.byUser(userId, countryId),
      queryFn: () => store.findByUser(userId, countryId),
      ...config,
    },
    ready
  );
};

export const useSimulationAssociation = (userId: string, simulationId: string) => {
  const { store, config, ready } = useSimulationAssociationStoreForMode();

  return useSessionGatedQuery(
    {
      queryKey: simulationAssociationKeys.specific(userId, simulationId),
      queryFn: () => store.findById(userId, simulationId),
      ...config,
    },
    ready
  );
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
  const store = useUserSimulationStore();
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
