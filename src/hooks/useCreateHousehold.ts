import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHousehold } from '@/api/household';

export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHousehold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
    onError: (err) => {
      console.error('Household creation failed', err);
      // TODO show a toast or alert here if desired?
    },
  });
}
