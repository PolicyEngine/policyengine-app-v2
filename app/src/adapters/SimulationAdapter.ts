import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload, SimulationSetOutputPayload } from '@/types/payloads';

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
      label: null,
      isCreated: true,
      output: metadata.output,
      status: metadata.status,
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

  /**
   * Creates payload for updating a simulation's output (PATCH request)
   * Note: Unlike reports, simulation PATCH includes id in body
   * Note: Uses output_json (stringified) not output, and doesn't accept status
   */
  static toUpdatePayload(
    simulationId: string,
    output: unknown
  ): SimulationSetOutputPayload {
    return {
      id: parseInt(simulationId, 10),
      output_json: JSON.stringify(output),
    };
  }

  /**
   * Creates payload for marking a simulation as completed with output
   */
  static toCompletedPayload(simulationId: string, output: unknown): SimulationSetOutputPayload {
    return this.toUpdatePayload(simulationId, output);
  }

  /**
   * Creates payload for marking a simulation as errored
   */
  static toErrorPayload(simulationId: string): SimulationSetOutputPayload {
    return this.toUpdatePayload(simulationId, null);
  }
}
