import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalize, denormalize } from 'normy';
import { fetchSimulationById } from '@/api/simulation';
import { fetchPolicyById } from '@/api/policy';
import { SimulationAdapter, PolicyAdapter } from '@/adapters';
import { 
  simulationSchema, 
  policySchema, 
  populationSchema,
  userSimulationSchema,
  userPolicySchema,
  userPopulationSchema 
} from '@/schemas/ingredientSchemas';
import { 
  useSimulationAssociationsByUser,
  useUserSimulationStore 
} from './useUserSimulation';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { simulationKeys, policyKeys } from '../libs/queryKeys';

interface NormalizedSimulationData {
  entities: {
    policies?: Record<string, any>;
    populations?: Record<string, any>;
    simulations?: Record<string, any>;
    userPolicies?: Record<string, any>;
    userPopulations?: Record<string, any>;
    userSimulations?: Record<string, any>;
  };
  result: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Enhanced hook that fetches user simulations along with their dependencies (policies, populations)
 * and returns normalized data for easy access by ID
 */
export const useUserSimulationsNormalized = (userId: string) => {
  const queryClient = useQueryClient();
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic

  // First, get the user-simulation associations
  const {
    data: simulationAssociations,
    isLoading: simulationAssociationsLoading,
    error: simulationAssociationsError,
  } = useSimulationAssociationsByUser(userId);

  // Also get user-policy associations (we'll need these for the policies referenced by simulations)
  const {
    data: policyAssociations,
    isLoading: policyAssociationsLoading,
    error: policyAssociationsError,
  } = usePolicyAssociationsByUser(userId);

  // Extract IDs
  const simulationIds = simulationAssociations?.map((a) => a.simulationId) ?? [];
  
  // Fetch all simulations in parallel
  const simulationQueries = useQueries({
    queries: simulationIds.map((simulationId) => ({
      queryKey: simulationKeys.byId(simulationId),
      queryFn: async () => {
        // Check cache first
        const cached = queryClient.getQueryData(simulationKeys.byId(simulationId));
        if (cached) {
          return cached;
        }
        
        // Fetch from API and convert using adapter
        const metadata = await fetchSimulationById(country, simulationId);
        return SimulationAdapter.fromMetadata(metadata);
      },
      enabled: !!simulationAssociations,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Extract unique policy IDs from simulations
  const policyIdsFromSimulations = new Set<string>();
  simulationQueries.forEach((query) => {
    if (query.data?.policyId) {
      policyIdsFromSimulations.add(query.data.policyId.toString());
    }
  });

  // Fetch policies that aren't already cached
  const policyQueries = useQueries({
    queries: Array.from(policyIdsFromSimulations).map((policyId) => ({
      queryKey: policyKeys.byId(policyId),
      queryFn: async () => {
        // Check cache first
        const cached = queryClient.getQueryData(policyKeys.byId(policyId));
        if (cached) {
          return cached;
        }
        
        // Fetch from API and convert using adapter
        const metadata = await fetchPolicyById(country, policyId);
        return PolicyAdapter.fromMetadata(metadata);
      },
      enabled: simulationQueries.some((q) => q.isSuccess),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // TODO: Add population fetching when Population APIs are ready
  // For now, we'll skip population fetching

  // Combine loading and error states
  const isLoading = 
    simulationAssociationsLoading || 
    policyAssociationsLoading ||
    simulationQueries.some((q) => q.isLoading) ||
    policyQueries.some((q) => q.isLoading);

  const error = 
    simulationAssociationsError || 
    policyAssociationsError ||
    simulationQueries.find((q) => q.error)?.error ||
    policyQueries.find((q) => q.error)?.error ||
    null;

  // Build the denormalized data structure for normalization
  const denormalizedData = simulationAssociations?.map((simulationAssoc, index) => {
    const simulation = simulationQueries[index]?.data;
    const policy = simulation?.policyId 
      ? policyQueries.find(q => q.data?.id === simulation.policyId)?.data 
      : undefined;
    
    // Find the corresponding user policy association
    const userPolicyAssoc = policyAssociations?.find(
      (pa) => pa.policyId === simulation?.policyId?.toString()
    );

    // Build the userSimulation object with proper references
    const userSimulation: any = {
      id: simulationAssoc.simulationId,
      ...simulationAssoc,
      simulation: simulation ? {
        ...simulation,
        policy,
        // population will be added when available
      } : undefined,
    };

    // If we have a userPolicy association, include it as a nested object
    // Normy will normalize this and replace it with an ID reference
    if (userPolicyAssoc) {
      userSimulation.userPolicy = {
        id: userPolicyAssoc.policyId,
        ...userPolicyAssoc,
        policy,
      };
      // Also store the ID reference for easier access
      userSimulation.userPolicyId = userPolicyAssoc.policyId;
    }

    // TODO: Add userPopulation when available
    // userSimulation.userPopulationId = ...

    return userSimulation;
  }) ?? [];

  // Normalize the data
  let normalizedData: NormalizedSimulationData = {
    entities: {},
    result: [],
    isLoading,
    error: error as Error | null,
  };

  if (!isLoading && !error && denormalizedData.length > 0) {
    const normalized = normalize(denormalizedData, [userSimulationSchema]);
    normalizedData = {
      ...normalized,
      isLoading,
      error: null,
    };
  }

  return {
    ...normalizedData,
    // Helper functions to denormalize specific entities
    getSimulation: (id: string) => {
      if (!normalizedData.entities.simulations?.[id]) return null;
      return denormalize(id, simulationSchema, normalizedData.entities);
    },
    getPolicy: (id: string) => {
      if (!normalizedData.entities.policies?.[id]) return null;
      return denormalize(id, policySchema, normalizedData.entities);
    },
    getUserSimulation: (id: string) => {
      if (!normalizedData.entities.userSimulations?.[id]) return null;
      return denormalize(id, userSimulationSchema, normalizedData.entities);
    },
    getUserPolicy: (id: string) => {
      if (!normalizedData.entities.userPolicies?.[id]) return null;
      return denormalize(id, userPolicySchema, normalizedData.entities);
    },
    // Helper function to get policy label for a simulation
    getPolicyLabelForSimulation: (simulationId: string) => {
      const userSimulation = normalizedData.entities.userSimulations?.[simulationId];
      if (!userSimulation) return null;
      
      // Access the userPolicy through the normalized reference
      const userPolicyId = userSimulation.userPolicy || userSimulation.userPolicyId;
      const userPolicy = normalizedData.entities.userPolicies?.[userPolicyId];
      
      return userPolicy?.label || null;
    },
    // Helper to get all simulation data with policy labels
    getSimulationsWithPolicyLabels: () => {
      return normalizedData.result.map(simId => {
        const userSimulation = normalizedData.entities.userSimulations?.[simId];
        const simulation = normalizedData.entities.simulations?.[userSimulation?.simulationId];
        
        // Get the policy label through userPolicy
        const userPolicyId = userSimulation?.userPolicy || userSimulation?.userPolicyId;
        const userPolicy = normalizedData.entities.userPolicies?.[userPolicyId];
        
        return {
          id: simId,
          label: userSimulation?.label,
          policyLabel: userPolicy?.label || 'Unnamed Policy',
          simulation,
          userSimulation,
          userPolicy,
        };
      });
    },
  };
};