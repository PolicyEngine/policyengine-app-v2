import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSimulation } from '@/api/simulation';
import { simulationKeys } from '@/libs/queryKeys';
import { useCreateSimulationAssociation } from './useUserSimulation';

export function useCreateSimulation() {
  const queryClient = useQueryClient();
  // const user = undefined; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateSimulationAssociation();

  const mutation = useMutation({
    mutationFn: createSimulation,
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: simulationKeys.all });

        // Create association with current user (or anonymous for session storage)
        const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID
        await createAssociation.mutateAsync({
          userId,
          simulationId: data.result.simulation_id, // This is from the API response structure; may be modified in API v2
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
