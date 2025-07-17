import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (import.meta.env.DEV) {
        console.log('Mock create policy...');
        return new Promise((res) =>
          setTimeout(() => res({ ...data, id: String(Date.now()), policy_hash: 'xyz789' }), 500)
        );
      }

      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create policy');
      return res.json();
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}
