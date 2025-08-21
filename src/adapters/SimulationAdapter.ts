import { Simulation } from '@/types/ingredients';
import { SimulationMetadata } from '@/types/simulationMetadata';

/**
 * Adapter for converting between Simulation and API formats
 */
export class SimulationAdapter {
  /**
   * Converts SimulationMetadata from API GET response to Simulation type
   */
  static fromMetadata(metadata: SimulationMetadata): Simulation {
    return {
      id: parseInt(metadata.simulation_id), // Convert string ID to number
      country_id: metadata.country_id,
      api_version: metadata.api_version,
      population_id: metadata.population_id,
      policy_id: metadata.policy_id,
    };
  }
  
  /**
   * Converts Simulation to format for API POST request
   */
  static toCreationPayload(simulation: Partial<Simulation>): SimulationCreationPayload {
    return {
      population_id: simulation.population_id,
      policy_id: simulation.policy_id,
    };
  }
}

export interface SimulationCreationPayload {
  population_id?: number;
  policy_id?: number;
}