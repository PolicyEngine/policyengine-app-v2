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
    mutationFn: (data: SimulationCreationPayload) => createSimulation(country, data),
    onSuccess: async (data) => {
      try {
        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        await createAssociation.mutateAsync({
          userId,
          simulationId: data.result.simulation_id, // This is from the API response structure; may be modified in API v2
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
