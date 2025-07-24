import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPolicy } from '@/api/policy';

export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}
