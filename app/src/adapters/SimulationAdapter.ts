import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

/**
 * Adapter for converting between Simulation and API formats
 * Agnostic to whether populationId refers to household or geography
 */
export class SimulationAdapter {
  /**
   * Converts SimulationMetadata from API GET response to Simulation type
   */
  static fromMetadata(metadata: SimulationMetadata): Simulation {
    if (!metadata.population_id) {
      throw new Error('Simulation metadata missing population_id');
    }

    // Use population_type directly from metadata if available
    let populationType: 'household' | 'geography';

    if (metadata.population_type) {
      populationType = metadata.population_type;
    } else {
      throw new Error('Simulation metadata missing population_type');
    }

    return {
      id: String(metadata.id),
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      policyId: metadata.policy_id,
      populationId: metadata.population_id,
      populationType,
    };
  }

  /**
   * Converts Simulation to format for API POST request
   */
  static toCreationPayload(simulation: Partial<Simulation>): SimulationCreationPayload {
    if (!simulation.populationId) {
      throw new Error('Simulation must have a populationId');
    }

    return {
      population_id: simulation.populationId,
      population_type: simulation.populationType,
      policy_id: simulation.policyId,
    };
  }
}
