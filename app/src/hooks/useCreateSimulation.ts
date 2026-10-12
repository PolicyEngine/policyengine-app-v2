import { useMutation } from '@tanstack/react-query';
import { createSimulation } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useCurrentUserId } from '@/libs/auth/useAssociationBackend';
import { SimulationCreationPayload } from '@/types/payloads';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

export function useCreateSimulation(simulationLabel?: string) {
  const country = useCurrentCountry();
  const userId = useCurrentUserId();
  const createAssociation = useCreateSimulationAssociation();

  const mutation = useMutation({
    mutationFn: (data: SimulationCreationPayload) => createSimulation(country, data),
    onSuccess: async (data) => {
      try {
        // File the association under the current user (the account when
        // signed in, localStorage otherwise)
        await createAssociation.mutateAsync({
          userId,
          simulationId: data.result.simulation_id,
          countryId: country,
          label: simulationLabel,
          isCreated: true,
        });
      } catch (error) {
        console.error('Simulation created but association failed:', error);
      }
    },
  });

  return {
    createSimulation: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
