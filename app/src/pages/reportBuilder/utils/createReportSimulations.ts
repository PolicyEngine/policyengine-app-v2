import { SimulationAdapter } from '@/adapters';
import { createHousehold } from '@/api/household';
import { createSimulation } from '@/api/simulation';
import { LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { MOCK_USER_ID } from '@/constants';
import type { Household } from '@/models/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationStateProps } from '@/types/pathwayState';
import { hasRequiredSimulationIngredients } from '@/utils/ingredientAvailability';
import { toApiPolicyId } from '../currentLaw';
import { householdMatchesReportYear } from './changeReportYear';

interface CreateReportSimulationsArgs {
  simulationStates: SimulationStateProps[];
  countryId: 'us' | 'uk';
  currentLawId: number;
  reportYear?: string;
}

interface CreatedReportSimulations {
  simulationIds: string[];
  simulations: Simulation[];
  simulationStates: SimulationStateProps[];
}

export async function createReportSimulations({
  simulationStates,
  countryId,
  currentLawId,
  reportYear,
}: CreateReportSimulationsArgs): Promise<CreatedReportSimulations> {
  if (!hasRequiredSimulationIngredients(simulationStates)) {
    throw new Error('Report has incomplete simulations');
  }

  // Validate the complete submission before creating any stored ingredients.
  for (const state of simulationStates) {
    const household = state.population.household;
    if (
      (state.countryId && state.countryId !== countryId) ||
      (household && household.countryId !== countryId)
    ) {
      throw new Error('Reload this report in its original country before saving household inputs.');
    }
    if (household && reportYear && !householdMatchesReportYear(household, reportYear)) {
      throw new Error(
        `Household inputs do not match report year ${reportYear}. Use “Use household inputs in ${reportYear}” to copy them, or select a household for that year.`
      );
    }
  }
  const savedHouseholds = new Map<string, Household>();
  const resolvedStates: SimulationStateProps[] = [];
  for (const state of simulationStates) {
    const household = state.population.household;
    if (!household || !state.population.householdNeedsCreation) {
      resolvedStates.push(state);
      continue;
    }
    // Shared drafts can use one immutable replacement; independent inputs keep their own IDs.
    const identity = JSON.stringify(household.toJSON());
    let saved = savedHouseholds.get(identity);
    if (!saved) {
      const created = await createHousehold(household.toV1CreationPayload());
      const id = created.result?.household_id;
      if (!id) {
        throw new Error('Household creation returned no ID. Your report has not been replaced.');
      }
      saved = household.withId(String(id));
      savedHouseholds.set(identity, saved);
    }
    resolvedStates.push({
      ...state,
      population: { ...state.population, household: saved, householdNeedsCreation: false },
    });
  }

  const simulationStore = new LocalStorageSimulationStore();
  const simulationIds: string[] = [];
  const simulations: Simulation[] = [];

  for (const simulationState of resolvedStates) {
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

  return { simulationIds, simulations, simulationStates: resolvedStates };
}
