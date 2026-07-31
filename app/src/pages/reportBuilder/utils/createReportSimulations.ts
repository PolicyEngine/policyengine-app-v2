import { SimulationAdapter } from '@/adapters';
import { createSimulation } from '@/api/simulation';
import { LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { MOCK_USER_ID } from '@/constants';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { hasRequiredSimulationIngredients } from '@/utils/ingredientAvailability';
import { toApiPolicyId } from '../currentLaw';

interface CreateReportSimulationsArgs {
  simulationStates: SimulationStateProps[];
  countryId: 'us' | 'uk';
  currentLawId: number;
}

interface CreatedReportSimulations {
  simulationIds: string[];
  simulations: Simulation[];
}

export async function createReportSimulations({
  simulationStates,
  countryId,
  currentLawId,
}: CreateReportSimulationsArgs): Promise<CreatedReportSimulations> {
  if (!hasRequiredSimulationIngredients(simulationStates)) {
    throw new Error('Report has incomplete simulations');
  }

  const simulationStore = new LocalStorageSimulationStore();
  const simulationIds: string[] = [];
  const simulations: Simulation[] = [];

  for (const simulationState of simulationStates) {
    const localPolicyId = simulationState.policy.id;
    if (!localPolicyId) {
      throw new Error('Simulation missing policy ID');
    }

    const policyId = toApiPolicyId(localPolicyId, currentLawId);
    const householdId = simulationState.population.household?.id;
    const geographyId = simulationState.population.geography?.geographyId;
    const populationId = householdId || geographyId;
    const populationType = householdId ? 'household' : 'geography';

    if (!populationId) {
      throw new Error('Simulation missing population');
    }

    const payload = SimulationAdapter.toCreationPayload({
      populationId,
      policyId,
      populationType,
    });
    const result = await createSimulation(countryId, payload);
    const simulationId = result.result.simulation_id;

    if (!simulationId) {
      throw new Error('Simulation creation returned no ID');
    }

    await simulationStore.create({
      userId: MOCK_USER_ID,
      simulationId,
      countryId,
      label: simulationState.label ?? undefined,
      isCreated: true,
    });

    simulationIds.push(simulationId);
    simulations.push({
      id: simulationId,
      countryId,
      apiVersion: undefined,
      policyId,
      populationId,
      populationType,
      label: simulationState.label,
      isCreated: true,
      output: null,
      status: 'pending',
    });
  }

  return { simulationIds, simulations };
}
