import { useMutation } from '@tanstack/react-query';
import { createSimulation } from '@/api/simulation';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { SimulationCreationPayload } from '@/types/payloads';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

export function useCreateSimulation(simulationLabel?: string) {
  const country = useCurrentCountry();
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateSimulationAssociation();

  const mutation = useMutation({
    // Only the ID: the calculator's query normalizer would write the stored
    // simulation, by its ID, over every cached record with that ID.
    mutationFn: async (data: SimulationCreationPayload) => ({
      result: (await createSimulation(country, data)).result,
    }),
    onSuccess: async (data) => {
      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

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
