export interface Simulation {
  populationId: string;
  policyId: string;
}

export interface UserSimulation {
  userId: string;
  simulationId: string;
  label?: string;
}
