import { useQueries, useQuery } from '@tanstack/react-query';
import { useQueryNormalizer } from '@normy/react-query';
import { fetchSimulationById } from '@/api/simulation';
import { fetchPolicyById } from '@/api/policy';
import { fetchHouseholdById } from '@/api/household';
import { SimulationAdapter, PolicyAdapter } from '@/adapters';
import { useSimulationAssociationsByUser } from './useUserSimulationAssociations';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { useHouseholdAssociationsByUser } from './useUserHousehold';
import { simulationKeys, policyKeys, householdKeys } from '../libs/queryKeys';
import { useParallelQueries, extractUniqueIds, combineLoadingStates } from './utils/normalizedUtils';
import { Simulation } from '@/types/ingredients/Simulation';
import { Policy } from '@/types/ingredients/Policy';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * Enhanced result type that includes all relationships
 */
interface EnhancedUserSimulation {
  // Core associations
  userSimulation: UserSimulation;
  simulation?: Simulation;
  
  // Related entities
  policy?: Policy;
  household?: HouseholdMetadata;
  
  // User associations for related entities
  userPolicy?: UserPolicy;
  userHousehold?: any; // Type to be defined when UserHousehold is implemented
  
  // Status
  isLoading: boolean;
  error: Error | null;
}

/**
 * Primary hook for fetching user simulations with all related data
 * Leverages @normy/react-query for automatic normalization and caching
 * 
 * Use this hook when you need:
 * - Full simulation context (policy, household, user associations)
 * - Detailed views or simulation pages
 * - Access to related entities
 * 
 * For simple lists or counts, use useSimulationAssociationsByUser instead
 */
export const useUserSimulations = (userId: string) => {
  const country = 'us'; // TODO: Replace with actual country ID retrieval logic
  const queryNormalizer = useQueryNormalizer();

  // Step 1: Fetch all user associations in parallel
  const {
    data: simulationAssociations,
    isLoading: simAssocLoading,
    error: simAssocError,
  } = useSimulationAssociationsByUser(userId);

  const {
    data: policyAssociations,
    isLoading: polAssocLoading,
    error: polAssocError,
  } = usePolicyAssociationsByUser(userId);

  const {
    data: householdAssociations,
    isLoading: housAssocLoading,
    error: housAssocError,
  } = useHouseholdAssociationsByUser(userId);

  // Step 2: Extract IDs for fetching
  const simulationIds = simulationAssociations?.map(a => a.simulationId.toString()) ?? [];

  // Step 3: Fetch simulations using parallel queries utility
  const simulationResults = useParallelQueries<Simulation>(
    simulationIds,
    {
      queryKey: simulationKeys.byId,
      queryFn: async (id) => {
        const metadata = await fetchSimulationById(country, id);
        return SimulationAdapter.fromMetadata(metadata);
      },
      enabled: !!simulationAssociations && simulationAssociations.length > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Step 4: Extract policy and household IDs from fetched simulations
  const simulations = simulationResults.queries
    .map(q => q.data)
    .filter((s): s is Simulation => !!s);

  const policyIds = extractUniqueIds(simulations, 'policyId');
  const householdIds = extractUniqueIds(simulations, 'populationId'); // populationId is actually householdId

  // Step 5: Fetch policies (only those not already in cache)
  const policyResults = useParallelQueries<Policy>(
    policyIds,
    {
      queryKey: policyKeys.byId,
      queryFn: async (id) => {
        const metadata = await fetchPolicyById(country, id);
        return PolicyAdapter.fromMetadata(metadata);
      },
      enabled: policyIds.length > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Step 6: Fetch households (populations)
  const householdResults = useParallelQueries<HouseholdMetadata>(
    householdIds,
    {
      queryKey: householdKeys.byId,
      queryFn: (id) => fetchHouseholdById(country, id),
      enabled: householdIds.length > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Step 7: Combine loading states
  const { isLoading, error } = combineLoadingStates(
    { isLoading: simAssocLoading, error: simAssocError },
    { isLoading: polAssocLoading, error: polAssocError },
    { isLoading: housAssocLoading, error: housAssocError },
    { isLoading: simulationResults.isLoading, error: simulationResults.error },
    { isLoading: policyResults.isLoading, error: policyResults.error },
    { isLoading: householdResults.isLoading, error: householdResults.error }
  );

  // Step 8: Build enhanced results with all relationships
  const enhancedSimulations: EnhancedUserSimulation[] = simulationAssociations?.map(userSim => {
    // Get simulation from normalized cache or query results
    const simulation = queryNormalizer.getObjectById(userSim.simulationId.toString()) as Simulation | undefined
      || simulations.find(s => s.id === userSim.simulationId);

    // Get related entities from normalized cache
    const policy = simulation?.policyId 
      ? queryNormalizer.getObjectById(simulation.policyId.toString()) as Policy | undefined
      : undefined;

    const household = simulation?.populationId
      ? queryNormalizer.getObjectById(simulation.populationId.toString()) as HouseholdMetadata | undefined
      : undefined;

    // Find user associations for related entities
    const userPolicy = policyAssociations?.find(
      pa => pa.policyId === simulation?.policyId
    );

    const userHousehold = householdAssociations?.find(
      ha => simulation?.populationId && ha.householdId === simulation.populationId.toString()
    );

    return {
      userSimulation: userSim,
      simulation,
      policy,
      household,
      userPolicy,
      userHousehold,
      isLoading: false,
      error: null,
    };
  }) ?? [];

  // Step 9: Helper functions for accessing specific data
  const getSimulationWithFullContext = (simulationId: number) => {
    return enhancedSimulations.find(es => es.userSimulation.simulationId === simulationId);
  };

  const getSimulationsByPolicy = (policyId: number) => {
    return enhancedSimulations.filter(es => es.simulation?.policyId === policyId);
  };

  const getSimulationsByHousehold = (householdId: number) => {
    return enhancedSimulations.filter(es => es.simulation?.populationId === householdId);
  };

  return {
    // Core data
    data: enhancedSimulations,
    isLoading,
    isError: !!error,
    error,
    
    // Raw associations (if needed)
    associations: {
      simulations: simulationAssociations,
      policies: policyAssociations,
      households: householdAssociations,
    },
    
    // Helper functions
    getSimulationWithFullContext,
    getSimulationsByPolicy,
    getSimulationsByHousehold,
    
    // Direct access to normalized cache
    getNormalizedSimulation: (id: string) => queryNormalizer.getObjectById(id) as Simulation | undefined,
    getNormalizedPolicy: (id: string) => queryNormalizer.getObjectById(id) as Policy | undefined,
    getNormalizedHousehold: (id: string) => queryNormalizer.getObjectById(id) as HouseholdMetadata | undefined,
  };
};

/**
 * Hook for accessing a single simulation with full context
 * Leverages the normalized cache for efficient data access
 */
export const useUserSimulationById = (userId: string, simulationId: string) => {
  const queryNormalizer = useQueryNormalizer();
  const country = 'us';

  // Try to get from normalized cache first
  const cachedSimulation = queryNormalizer.getObjectById(simulationId) as Simulation | undefined;

  // Fetch if not in cache
  const { data: simulation, isLoading: simLoading, error: simError } = useQuery({
    queryKey: simulationKeys.byId(simulationId),
    queryFn: async () => {
      const metadata = await fetchSimulationById(country, simulationId);
      return SimulationAdapter.fromMetadata(metadata);
    },
    enabled: !cachedSimulation,
    staleTime: 5 * 60 * 1000,
  });

  const finalSimulation = cachedSimulation || simulation;

  // Fetch related entities if we have a simulation
  const { data: policy } = useQuery({
    queryKey: policyKeys.byId(finalSimulation?.policyId?.toString() ?? ''),
    queryFn: async () => {
      const metadata = await fetchPolicyById(country, finalSimulation!.policyId.toString());
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: !!finalSimulation?.policyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: household } = useQuery({
    queryKey: householdKeys.byId(finalSimulation?.populationId?.toString() ?? ''),
    queryFn: () => fetchHouseholdById(country, finalSimulation!.populationId.toString()),
    enabled: !!finalSimulation?.populationId,
    staleTime: 5 * 60 * 1000,
  });

  // Get user associations
  const { data: policyAssociations } = usePolicyAssociationsByUser(userId);
  const { data: householdAssociations } = useHouseholdAssociationsByUser(userId);

  const userPolicy = policyAssociations?.find(
    pa => pa.policyId === finalSimulation?.policyId
  );

  const userHousehold = householdAssociations?.find(
    ha => finalSimulation?.populationId && ha.householdId === finalSimulation.populationId.toString()
  );

  return {
    simulation: finalSimulation,
    policy,
    household,
    userPolicy,
    userHousehold,
    isLoading: simLoading,
    error: simError,
  };
};