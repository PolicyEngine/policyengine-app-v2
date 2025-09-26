import { useQuery } from '@tanstack/react-query';
import { policiesAPI } from '@/api/v2/policies';
import { simulationsAPI } from '@/api/v2/simulations';
import { useCurrentCountry } from './useCurrentCountry';

/**
 * Hook to fetch all simulations from the API for the current country
 */
export const useSimulations = () => {
  const country = useCurrentCountry();

  return useQuery({
    queryKey: ['simulations', country],
    queryFn: async () => {
      console.log(`[useSimulations] Fetching simulations for country: ${country}...`);
      // First get all simulations
      const allSimulations = await simulationsAPI.list({ limit: 1000 });

      // Then get policies to filter by country
      const policyIds = [...new Set(allSimulations.map(s => s.policy_id).filter(Boolean))];
      if (policyIds.length === 0) {
        return [];
      }

      // Fetch policies to check their countries
      const policies = await Promise.all(
        policyIds.map(id => policiesAPI.get(id).catch(() => null))
      );

      // Create a set of policy IDs that belong to the current country
      const countryPolicyIds = new Set(
        policies
          .filter(p => p && (!p.country || p.country === country))
          .map(p => p!.id)
      );

      // Filter simulations by country policies
      const countrySimulations = allSimulations.filter(
        sim => countryPolicyIds.has(sim.policy_id)
      );

      console.log(`[useSimulations] Found ${countrySimulations.length} simulations for ${country}`);
      return countrySimulations;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to fetch all simulations with their related policies for the current country
 */
export const useSimulationsWithPolicies = () => {
  const country = useCurrentCountry();

  const {
    data: simulations,
    isLoading: simulationsLoading,
    error: simulationsError,
  } = useSimulations();

  // Get unique policy IDs
  const policyIds = [...new Set(simulations?.map((s) => s.policy_id).filter(Boolean) || [])];

  const {
    data: policies,
    isLoading: policiesLoading,
    error: policiesError,
  } = useQuery({
    queryKey: ['policies', policyIds],
    queryFn: async () => {
      const policyPromises = policyIds.map((id) => policiesAPI.get(id));
      const policies = await Promise.all(policyPromises);
      console.log('[useSimulationsWithPolicies] Fetched policies:', policies);
      return policies;
    },
    enabled: policyIds.length > 0,
    staleTime: 30 * 1000,
  });

  // Create a map of policies by ID
  const policyMap = new Map(policies?.map((p) => [p.id, p]) || []);

  // Combine simulations with their policies
  const simulationsWithPolicies =
    simulations?.map((sim) => ({
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
