import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';

/**
 * Adapter for converting between Simulation and API formats
 */
export class SimulationAdapter {
  /**
   * Converts SimulationMetadata from API GET response to Simulation type
   * Handles snake_case to camelCase conversion
   */
  static fromMetadata(metadata: SimulationMetadata): Simulation {
    return {
      id: parseInt(metadata.simulation_id, 10), // Convert string ID to number
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      populationId: metadata.population_id,
      policyId: metadata.policy_id,
    };
  }

  /**
   * Converts Simulation to format for API POST request
   * API expects snake_case format
   */
  static toCreationPayload(simulation: Partial<Simulation>): SimulationCreationPayload {
    return {
      population_id: simulation.populationId,
      policy_id: simulation.policyId,
    };
  }
}

export interface SimulationCreationPayload {
  population_id?: number;
  policy_id?: number;
}
