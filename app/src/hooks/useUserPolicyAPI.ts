import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { policiesAPI, PolicyWithParameters } from '@/api/v2/policies';

// Fetch all policies directly from the database
export const useAllPolicies = () => {
  return useQuery({
    queryKey: ['policies', 'all'],
    queryFn: () => policiesAPI.list({ limit: 1000 }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live data
  });
};

// Fetch single policy with parameters
export const usePolicyWithParameters = (policyId: string | undefined) => {
  return useQuery({
    queryKey: ['policies', policyId, 'withParameters'],
    queryFn: () => policiesAPI.getWithParameters(policyId!),
    enabled: !!policyId,
    staleTime: 30 * 1000,
  });
};

// Create policy mutation
export const useCreatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: policiesAPI.create,
    onSuccess: () => {
      // Invalidate and refetch policies list
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};

// Update policy mutation
export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof policiesAPI.update>[1] }) =>
      policiesAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific policy and list
      queryClient.invalidateQueries({ queryKey: ['policies', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['policies', 'all'] });
    },
  });
};

// Delete policy mutation
export const useDeletePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: policiesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
};
