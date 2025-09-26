import { useQuery } from '@tanstack/react-query';
import { simulationsAPI } from '@/api/v2/simulations';
import { policiesAPI } from '@/api/v2/policies';

/**
 * Hook to fetch all simulations from the API
 */
export const useSimulations = () => {
  return useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const simulations = await simulationsAPI.list({ limit: 1000 });
      console.log('[useSimulations] Fetched simulations:', simulations);
      return simulations;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to fetch all simulations with their related policies
 */
export const useSimulationsWithPolicies = () => {
  const { data: simulations, isLoading: simulationsLoading, error: simulationsError } = useSimulations();

  // Get unique policy IDs
  const policyIds = [...new Set(simulations?.map(s => s.policy_id).filter(Boolean) || [])];

  const { data: policies, isLoading: policiesLoading, error: policiesError } = useQuery({
    queryKey: ['policies', policyIds],
    queryFn: async () => {
      const policyPromises = policyIds.map(id => policiesAPI.get(id));
      const policies = await Promise.all(policyPromises);
      console.log('[useSimulationsWithPolicies] Fetched policies:', policies);
      return policies;
    },
    enabled: policyIds.length > 0,
    staleTime: 30 * 1000,
  });

  // Create a map of policies by ID
  const policyMap = new Map(policies?.map(p => [p.id, p]) || []);

  // Combine simulations with their policies
  const simulationsWithPolicies = simulations?.map(sim => ({
    ...sim,
    policy: policyMap.get(sim.policy_id),
  })) || [];

  return {
    data: simulationsWithPolicies,
    isLoading: simulationsLoading || policiesLoading,
    error: simulationsError || policiesError,
  };
};

/**
 * Hook to fetch a single simulation by ID
 */
export const useSimulation = (simulationId: string) => {
  return useQuery({
    queryKey: ['simulation', simulationId],
    queryFn: () => simulationsAPI.get(simulationId),
    enabled: !!simulationId,
    staleTime: 30 * 1000,
  });
};