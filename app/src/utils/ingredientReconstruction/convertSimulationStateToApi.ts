import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState/SimulationStateProps';

/**
 * Converts SimulationStateProps (pathway local state) to Simulation (API format)
 *
 * SimulationStateProps has nested policy/population objects with IDs buried in them.
 * Simulation has flat policyId/populationId fields that CalcOrchestrator expects.
 *
 * This conversion is critical for report creation flow where pathways pass their
 * local state to useCreateReport, which then passes to CalcOrchestrator.
 *
 * @param stateProps - SimulationStateProps from pathway local state
 * @returns Simulation object with flat structure expected by calculation system
 */
export function convertSimulationStateToApi(
  stateProps: SimulationStateProps | null | undefined
): Simulation | null {
  if (!stateProps) {
    return null;
  }

  // Extract policyId from nested policy object
  // In v2, current law = null (intentional), undefined = not yet set
  const policyId = stateProps.policy?.id;
  if (policyId === undefined) {
    console.warn('[convertSimulationStateToApi] Simulation missing policy.id:', stateProps);
    return null;
  }

  // Extract populationId and populationType from nested population object
  const population = stateProps.population;
  let populationId: string | undefined;
  let populationType: 'household' | 'geography' | undefined;

  if (population?.household?.id) {
    populationId = population.household.id;
    populationType = 'household';
  } else if (population?.geography?.regionCode) {
    // For geography, use regionCode as the population identifier
    populationId = population.geography.regionCode;
    populationType = 'geography';
  }

  if (!populationId || !populationType) {
    console.warn('[convertSimulationStateToApi] Simulation missing population ID:', stateProps);
    return null;
  }

  // Convert to flat Simulation structure
  return {
    id: stateProps.id,
    countryId: stateProps.countryId as any,
    apiVersion: stateProps.apiVersion,
    policyId, // ← Flattened from stateProps.policy.id
    populationId, // ← Flattened from stateProps.population.household/geography.id
    populationType, // ← Derived from which population type is present
    label: stateProps.label,
    isCreated: !!stateProps.id, // Has ID = created
    output: stateProps.output,
    status: stateProps.status,
  };
}
