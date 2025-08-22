import { fetchSimulationById } from '@/api/simulation';
import { fetchPolicyById } from '@/api/policy';
import { SimulationAdapter, PolicyAdapter } from '@/adapters';
import { 
  simulationSchema, 
  policySchema, 
  userSimulationSchema,
  userPolicySchema
} from '@/schemas/ingredientSchemas';
import { 
  useSimulationAssociationsByUser,
  useUserSimulationStore 
} from './useUserSimulation';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { simulationKeys, policyKeys } from '../libs/queryKeys';
import { Policy } from '@/types/ingredients/Policy';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import {
  NormalizedData,
  useParallelQueries,
  normalizeData,
  createDenormalizer,
  combineLoadingStates,
  extractUniqueIds,
  getNestedEntity,
  createRelationshipGetter,
} from './utils/normalizedUtils';

interface SimulationNormalizedData extends NormalizedData {
  entities: {
    policies?: Record<string, Policy>;
    populations?: Record<string, any>;
    simulations?: Record<string, Simulation>;
    userPolicies?: Record<string, UserPolicy>;
    userPopulations?: Record<string, any>;
    userSimulations?: Record<string, UserSimulation>;
  };
}

/**
 * Enhanced hook that fetches user simulations along with their dependencies (policies, populations)
 * and returns normalized data for easy access by ID
 */
export const useUserSimulationsNormalized = (userId: string) => {
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic

  // Fetch user-simulation associations
  const {
    data: simulationAssociations,
    isLoading: simulationAssociationsLoading,
    error: simulationAssociationsError,
  } = useSimulationAssociationsByUser(userId);

  // Fetch user-policy associations (needed for userPolicy relationships)
  const {
    data: policyAssociations,
    isLoading: policyAssociationsLoading,
    error: policyAssociationsError,
  } = usePolicyAssociationsByUser(userId);

  // Extract simulation IDs
  const simulationIds = simulationAssociations?.map((a) => a.simulationId) ?? [];
  
  // Fetch all simulations in parallel
  const { 
    queries: simulationQueries, 
    isLoading: simulationsLoading, 
    error: simulationsError 
  } = useParallelQueries<Simulation>(simulationIds.map(id => id.toString()), {
    queryKey: simulationKeys.byId,
    queryFn: async (simulationId) => {
      const metadata = await fetchSimulationById(country, simulationId);
      return SimulationAdapter.fromMetadata(metadata);
    },
    enabled: !!simulationAssociations,
  });

  // Extract unique policy IDs from simulations
  const policyIds = extractUniqueIds(
    simulationQueries.map(q => q.data).filter(Boolean) as Simulation[],
    'policyId'
  );

  // Fetch policies that aren't already cached
  const { 
    queries: policyQueries, 
    isLoading: policiesLoading, 
    error: policiesError 
  } = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (policyId) => {
      const metadata = await fetchPolicyById(country, policyId);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: simulationQueries.some((q) => q.isSuccess),
  });

  // TODO: Add population fetching when Population APIs are ready

  // Combine loading and error states
  const { isLoading, error } = combineLoadingStates(
    { isLoading: simulationAssociationsLoading, error: simulationAssociationsError },
    { isLoading: policyAssociationsLoading, error: policyAssociationsError },
    { isLoading: simulationsLoading, error: simulationsError },
    { isLoading: policiesLoading, error: policiesError }
  );

  // Build denormalized data structure
  const denormalizedData = buildDenormalizedSimulationData(
    simulationAssociations,
    policyAssociations,
    simulationQueries,
    policyQueries
  );

  // Normalize the data
  const normalizedData = normalizeData<any>(
    denormalizedData,
    [userSimulationSchema],
    isLoading,
    error
  ) as SimulationNormalizedData;

  // Create helper functions
  const getSimulation = createDenormalizer<Simulation>('simulations', simulationSchema);
  const getPolicy = createDenormalizer<Policy>('policies', policySchema);
  const getUserSimulation = createDenormalizer<UserSimulation>('userSimulations', userSimulationSchema);
  const getUserPolicy = createDenormalizer<UserPolicy>('userPolicies', userPolicySchema);

  // Create specialized relationship getters
  const getPolicyForSimulation = createRelationshipGetter<Simulation, Policy>(
    'simulations',
    'policies',
    'policyId'
  );

  return {
    ...normalizedData,
    // Helper functions
    getSimulation: (id: string) => getSimulation(id, normalizedData.entities),
    getPolicy: (id: string) => getPolicy(id, normalizedData.entities),
    getUserSimulation: (id: string) => getUserSimulation(id, normalizedData.entities),
    getUserPolicy: (id: string) => getUserPolicy(id, normalizedData.entities),
    
    // Specialized helpers
    getPolicyLabelForSimulation: (simulationId: string) => {
      const userSimulation = getNestedEntity<UserSimulation>(
        normalizedData.entities,
        'userSimulations',
        simulationId
      );
      if (!userSimulation) return null;
      
      // Access userPolicy through normalized reference
      const userPolicyId = (userSimulation as any).userPolicy || (userSimulation as any).userPolicyId;
      const userPolicy = getNestedEntity<UserPolicy>(
        normalizedData.entities,
        'userPolicies',
        userPolicyId
      );
      
      return userPolicy?.label || null;
    },
    
    // Get all simulation data with policy labels
    getSimulationsWithPolicyLabels: () => {
      return normalizedData.result.map(simId => {
        const userSimulation = normalizedData.entities.userSimulations?.[simId];
        const simulation = userSimulation ? normalizedData.entities.simulations?.[userSimulation.simulationId] : undefined;
        
        // Get policy label through userPolicy
        const userPolicyId = (userSimulation as any)?.userPolicy || (userSimulation as any)?.userPolicyId;
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

/**
 * Builds denormalized data structure for simulations with all relationships
 */
function buildDenormalizedSimulationData(
  simulationAssociations: any[] | undefined,
  policyAssociations: any[] | undefined,
  simulationQueries: any[],
  policyQueries: any[]
): any[] {
  if (!simulationAssociations) return [];

  // Create policy lookup map
  const policyLookup = new Map<string, any>();
  policyQueries.forEach(q => {
    if (q.data?.id) {
      policyLookup.set(q.data.id.toString(), q.data);
    }
  });

  return simulationAssociations.map((simulationAssoc, index) => {
    const simulation = simulationQueries[index]?.data;
    const policy = simulation?.policyId 
      ? policyLookup.get(simulation.policyId.toString())
      : undefined;
    
    // Find corresponding user policy association
    const userPolicyAssoc = policyAssociations?.find(
      (pa) => pa.policyId === simulation?.policyId?.toString()
    );

    // Build userSimulation object with proper references
    const userSimulation: any = {
      id: simulationAssoc.simulationId,
      ...simulationAssoc,
      simulation: simulation ? {
        ...simulation,
        policy,
        // population will be added when available
      } : undefined,
    };

    // Include userPolicy reference if available
    if (userPolicyAssoc) {
      userSimulation.userPolicy = {
        id: userPolicyAssoc.policyId,
        ...userPolicyAssoc,
        policy,
      };
      // Store ID reference for easier access
      userSimulation.userPolicyId = userPolicyAssoc.policyId;
    }

    // TODO: Add userPopulation when available

    return userSimulation;
  });
}