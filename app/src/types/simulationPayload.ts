import { Simulation } from '@/types/ingredients/Simulation';

export interface SimulationCreationPayload {
  population_id?: string;
  policy_id?: string;
}

export function serializeSimulationCreationPayload(
  simulation: Simulation
): SimulationCreationPayload {
  return {
    population_id: simulation.populationId.toString(),
    policy_id: simulation.policyId.toString(),
  };
}
