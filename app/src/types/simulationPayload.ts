import { Simulation } from '@/types/simulation';

export interface SimulationCreationPayload {
  populationId?: string;
  policyId?: string;
}

export function serializeSimulationCreationPayload(
  simulation: Simulation
): SimulationCreationPayload {
  return {
    populationId: simulation.populationId,
    policyId: simulation.policyId,
  };
}
