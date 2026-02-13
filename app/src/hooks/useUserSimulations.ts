import { useQueryNormalizer } from '@normy/react-query';
import { useQuery } from '@tanstack/react-query';
import { HouseholdAdapter, PolicyAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { householdKeys, policyKeys, simulationKeys } from '../libs/queryKeys';
import { useRegionsList } from './useStaticMetadata';
import { useHouseholdAssociationsByUser } from './useUserHousehold';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { useSimulationAssociationsByUser } from './useUserSimulationAssociations';
import {
  combineLoadingStates,
  extractUniqueIds,
  useParallelQueries,
} from './utils/normalizedUtils';

/**
 * Enhanced result type that includes all relationships
 */
export interface EnhancedUserSimulation {
  // Core associations
  userSimulation: UserSimulation;
  simulation?: Simulation;

  // Related entities
  policy?: Policy;
  household?: Household;
  geography?: Geography;

  // User associations for related entities
  userPolicy?: UserPolicy;
  userHousehold?: UserHouseholdPopulation;

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
  const country = useCurrentCountry();
  const queryNormalizer = useQueryNormalizer();

  // Get geography data from static metadata
  const geographyOptions = useRegionsList(country);

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
  const simulationIds = simulationAssociations?.map((a) => a.simulationId).filter(Boolean) ?? [];

  // Step 3: Fetch simulations using parallel queries utility
  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchSimulationById(country, id);
      return SimulationAdapter.fromMetadata(metadata);
    },
    enabled: !!simulationAssociations && simulationAssociations.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Step 4: Extract policy and household IDs from fetched simulations
  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  const policyIds = extractUniqueIds(simulations, 'policyId');

  // Separate household and geography IDs based on populationType
  const householdIds = simulations
    .filter((s) => s.populationType === 'household' && s.populationId)
    .map((s) => s.populationId as string)
    .filter((id, index, self) => self.indexOf(id) === index);

  // Geography IDs for future use when we need to fetch geography data
  // const geographyIds = simulations
  //   .filter(s => s.populationType === 'geography')
  //   .map(s => s.populationId)
  //   .filter((id, index, self) => id && self.indexOf(id) === index);

  // Step 5: Fetch policies (only those not already in cache)
  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const response = await fetchPolicyById(id);
      return PolicyAdapter.fromV2Response(response);
    },
    enabled: policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Step 6: Fetch households (populations)
  const householdResults = useParallelQueries<Household>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdAdapter.fromMetadata(metadata);
    },
    enabled: householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

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
  const enhancedSimulations: EnhancedUserSimulation[] =
    simulationAssociations
      ?.filter((userSim) => userSim.simulationId) // Filter out associations without simulationId
      .map((userSim) => {
        // Get simulation from normalized cache or query results
        const simulation =
          (queryNormalizer.getObjectById(userSim.simulationId) as Simulation | undefined) ||
          simulations.find((s) => s.id === userSim.simulationId);

        // Get related entities from normalized cache
        const policy = simulation?.policyId
          ? (queryNormalizer.getObjectById(simulation.policyId) as Policy | undefined)
          : undefined;

        // Determine if populationId is household or geography based on populationType
        let household: Household | undefined;
        let geography: Geography | undefined;
        let userHousehold: UserHouseholdPopulation | undefined;

        if (simulation?.populationId && simulation?.populationType) {
          if (simulation.populationType === 'household') {
            household = queryNormalizer.getObjectById(simulation.populationId) as
              | Household
              | undefined;
            userHousehold = householdAssociations?.find(
              (ha) => ha.householdId === simulation.populationId
            );
          } else if (simulation.populationType === 'geography') {
            // Create simplified Geography object from regionCode (populationId)
            geography = {
              countryId: simulation.countryId,
              regionCode: simulation.populationId,
            } as Geography;
          }
        }

        // Find user associations for related entities
        const userPolicy = policyAssociations?.find((pa) => pa.policyId === simulation?.policyId);

        return {
          userSimulation: userSim,
          simulation,
          policy,
          household,
          geography,
          userPolicy,
          userHousehold,
          isLoading: false,
          error: null,
        };
      }) ?? [];

  // Step 9: Helper functions for accessing specific data
  const getSimulationWithFullContext = (simulationId: string) => {
    return enhancedSimulations.find((es) => es.userSimulation.simulationId === simulationId);
  };

  const getSimulationsByPolicy = (policyId: string) => {
    return enhancedSimulations.filter((es) => es.simulation?.policyId === policyId);
  };

  const getSimulationsByHousehold = (householdId: string) => {
    return enhancedSimulations.filter((es) => es.simulation?.populationId === householdId);
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
    getNormalizedSimulation: (id: string) =>
      queryNormalizer.getObjectById(id) as Simulation | undefined,
    getNormalizedPolicy: (id: string) => queryNormalizer.getObjectById(id) as Policy | undefined,
    getNormalizedHousehold: (id: string) =>
      queryNormalizer.getObjectById(id) as HouseholdMetadata | undefined,
  };
};

/**
 * Hook for accessing a single simulation with full context
 * Leverages the normalized cache for efficient data access
 */
export const useUserSimulationById = (userId: string, simulationId: string) => {
  const queryNormalizer = useQueryNormalizer();
  const country = useCurrentCountry();

  // Try to get from normalized cache first
  const cachedSimulation = queryNormalizer.getObjectById(simulationId) as Simulation | undefined;

  // Fetch if not in cache
  const {
    data: simulation,
    isLoading: simLoading,
    error: simError,
  } = useQuery({
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
      const response = await fetchPolicyById(finalSimulation!.policyId!.toString());
      return PolicyAdapter.fromV2Response(response);
    },
    enabled: !!finalSimulation?.policyId,
    staleTime: 5 * 60 * 1000,
  });

  // Determine if populationId is a household or geography
  // Try to fetch as household first
  const populationId = finalSimulation?.populationId;

  const { data: householdMetadata } = useQuery({
    queryKey: householdKeys.byId(populationId ?? ''),
    queryFn: () => fetchHouseholdById(country, populationId!),
    enabled: !!populationId,
    staleTime: 5 * 60 * 1000,
    retry: 1, // Only retry once if it's not a household
  });

  const household = householdMetadata
    ? HouseholdAdapter.fromMetadata(householdMetadata)
    : undefined;

  // Get user associations
  const { data: policyAssociations } = usePolicyAssociationsByUser(userId);
  const { data: householdAssociations } = useHouseholdAssociationsByUser(userId);

  const userPolicy = policyAssociations?.find((pa) => pa.policyId === finalSimulation?.policyId);

  // Only get userHousehold if we actually have a household (not a geography)
  const userHousehold =
    finalSimulation?.populationId && household
      ? householdAssociations?.find((ha) => ha.householdId === finalSimulation.populationId)
      : undefined;

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
