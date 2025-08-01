import { useQueryClient, useMutation } from '@tanstack/react-query';
import { createSimulation } from '@/api/simulation';
import { simulationKeys } from '@/libs/queryKeys';

export const useCreateSimulation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSimulation,
    onSuccess: (data) => {
      // Handle successful simulation creation, e.g., navigate or update state
      console.log('Simulation created successfully:', data);
      try {
        queryClient.invalidateQueries({ queryKey: simulationKeys.all });

      } catch (error) {
        console.error('Error invalidating queries:', error);
      }
    }
  })

  return {
    createSimulation: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError
  };
};

