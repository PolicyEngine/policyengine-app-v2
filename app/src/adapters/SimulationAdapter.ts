import { Household } from '@/types/ingredients/Household';
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

    // Parse output_json if present
    let output: Household | null = null;
    if (metadata.output_json) {
      try {
        const householdData = JSON.parse(metadata.output_json);
        output = {
          countryId: metadata.country_id,
          householdData,
        };
      } catch (error) {
        console.error('[SimulationAdapter] Failed to parse output_json:', error);
      }
    }

    return {
      id: String(metadata.id),
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      policyId: metadata.policy_id,
      populationId: metadata.population_id,
      populationType,
      label: null,
      isCreated: true,
      output,
    };
  }

  /**
   * Converts Simulation to format for API POST request
   */
  static toCreationPayload(simulation: Partial<Simulation>): SimulationCreationPayload {
    if (!simulation.populationId) {
      throw new Error('Simulation must have a populationId');
    }

    if (!simulation.policyId) {
      throw new Error('Simulation must have a policyId');
    }

    if (!simulation.populationType) {
      throw new Error('Simulation must have a populationType');
    }

    return {
      population_id: simulation.populationId,
      population_type: simulation.populationType,
      policy_id: parseInt(simulation.policyId, 10),
    };
  }
}
