import { useQuery } from '@tanstack/react-query';
import { SimulationAdapter, PolicyAdapter, HouseholdAdapter } from '@/adapters';
import { fetchSimulationById } from '@/api/simulation';
import { fetchPolicyById } from '@/api/policy';
import { fetchHouseholdById } from '@/api/household';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { simulationKeys, policyKeys, householdKeys } from '@/libs/queryKeys';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { Policy } from '@/types/ingredients/Policy';
import type { Household } from '@/types/ingredients/Household';
import type { Geography } from '@/types/ingredients/Geography';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

/**
 * Hook to fetch a simulation with its related policy and population
 * Provides normalized data access with automatic dependency resolution
 *
 * @param simulationId - The simulation ID to fetch
 * @returns Simulation with its policy and population (household or geography)
 */
export function useNormalizedSimulation(simulationId: string) {
  const country = useCurrentCountry();

  // Get geography data from metadata for geography-based simulations
  const geographyOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Layer 1: Fetch simulation
  const simulationQuery = useQuery({
    queryKey: simulationKeys.byId(simulationId),
    queryFn: async () => {
      console.log(`[useNormalizedSimulation] Fetching simulation: ${simulationId}`);
      const metadata = await fetchSimulationById(country, simulationId);
      return SimulationAdapter.fromMetadata(metadata);
    },
    enabled: !!simulationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const simulation = simulationQuery.data;

  // Layer 2: Fetch policy (if simulation has one)
  const policyQuery = useQuery({
    queryKey: policyKeys.byId(simulation?.policyId || ''),
    queryFn: async () => {
      console.log(`[useNormalizedSimulation] Fetching policy: ${simulation!.policyId}`);
      const metadata = await fetchPolicyById(country, simulation!.policyId!);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: !!simulation?.policyId,
    staleTime: 5 * 60 * 1000,
  });

  // Layer 3: Fetch population based on populationType
  // For household populations
  const householdQuery = useQuery({
    queryKey: householdKeys.byId(simulation?.populationId || ''),
    queryFn: async () => {
      console.log(`[useNormalizedSimulation] Fetching household: ${simulation!.populationId}`);
      const metadata = await fetchHouseholdById(country, simulation!.populationId!);
      return HouseholdAdapter.fromAPI(metadata);
    },
    enabled:
      !!simulation?.populationId &&
      simulation?.populationType === 'household',
    staleTime: 5 * 60 * 1000,
  });

  // For geography populations (extracted from metadata)
  const geography: Geography | undefined =
    simulation?.populationType === 'geography' && simulation?.populationId
      ? extractGeographyFromMetadata(simulation.populationId, country, geographyOptions)
      : undefined;

  return {
    simulation: simulationQuery.data,
    policy: policyQuery.data,
    population: simulation?.populationType === 'household' ? householdQuery.data : geography,
    populationType: simulation?.populationType,
    isLoading: simulationQuery.isLoading || policyQuery.isLoading || householdQuery.isLoading,
    error: simulationQuery.error || policyQuery.error || householdQuery.error,
  };
}

/**
 * Extract geography information from metadata
 * Geography data comes from Redux metadata rather than API
 */
function extractGeographyFromMetadata(
  geographyId: string,
  countryId: string,
  geographyOptions: any
): Geography | undefined {
  // Handle national geography
  if (geographyId === countryId) {
    return {
      id: countryId,
      countryId: countryId as any,
      scope: 'national',
      geographyId: countryId,
      name: countryId.toUpperCase(),
    };
  }

  // Handle subnational geography
  const geoOption = geographyOptions?.[geographyId];
  if (geoOption) {
    return {
      id: `${countryId}-${geographyId}`,
      countryId: countryId as any,
      scope: 'subnational',
      geographyId,
      name: geoOption.label || geographyId,
    };
  }

  return undefined;
}
