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
   * Handles conversion of numeric IDs to strings for frontend use
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
      id: String(metadata.id),  // Convert number to string for frontend use
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      policyId: String(metadata.policy_id),  // Convert number to string for frontend use
      populationId: metadata.population_id,  // Already a string (VARCHAR in DB)
      populationType,
    };
  }

  /**
   * Converts Simulation to format for API POST request
   * Handles conversion of string IDs to numbers for backend
   */
  static toCreationPayload(simulation: Partial<Simulation>): SimulationCreationPayload {
    if (!simulation.populationId) {
      throw new Error('Simulation must have a populationId');
    }

    // Handle policy_id conversion: string to number, null stays null, undefined stays undefined
    let policyId: number | undefined;
    if (simulation.policyId === null || simulation.policyId === undefined) {
      policyId = simulation.policyId as any;
    } else {
      policyId = Number(simulation.policyId);
    }

    return {
      population_id: simulation.populationId,  // Already a string
      population_type: simulation.populationType,
      policy_id: policyId,
    };
  }
}
