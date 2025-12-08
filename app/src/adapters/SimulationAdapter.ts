import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload, SimulationSetOutputPayload } from '@/types/payloads';

/**
 * Adapter for converting between Simulation and API formats
 * Agnostic to whether populationId refers to household or geography
 *
 * STATUS VALUES (matches API):
 * - 'pending': Not yet calculated OR currently calculating
 * - 'complete': Calculation finished and persisted
 * - 'error': Calculation failed
 *
 * Note: Frontend uses CalcStatus.status='computing' for ephemeral real-time tracking,
 * but Simulation.status uses 'pending' for the persistent database state.
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

    // Parse output if it's a stringified JSON
    let parsedOutput = metadata.output;
    if (metadata.output && typeof metadata.output === 'string') {
      try {
        parsedOutput = JSON.parse(metadata.output);
      } catch (error) {
        console.error('[SimulationAdapter.fromMetadata] Failed to parse output:', error);
        // Keep original value if parsing fails
        parsedOutput = metadata.output;
      }
    }

    const simulation = {
      id: String(metadata.id),
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      policyId: String(metadata.policy_id),
      populationId: String(metadata.population_id),
      populationType,
      label: null,
      isCreated: true,
      output: parsedOutput,
      status: metadata.status,
    };

    return simulation;
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
   * Note: ID is in body, not URL path (same as report PATCH format)
   * Note: Output is NOT stringified here - it's stringified when the entire payload is JSON.stringified
   */
  static toUpdatePayload(
    id: number,
    output: unknown,
    status: 'pending' | 'complete' | 'error'
  ): SimulationSetOutputPayload {
    return {
      id,
      output: typeof output === 'string' ? output : output ? JSON.stringify(output) : null,
      status,
    };
  }

  /**
   * Creates payload for marking a simulation as completed with output
   * Note: Output is NOT stringified here - it's stringified when the entire payload is JSON.stringified
   */
  static toCompletedPayload(id: number, output: unknown): SimulationSetOutputPayload {
    return {
      id,
      output: typeof output === 'string' ? output : JSON.stringify(output),
      status: 'complete',
    };
  }

  /**
   * Creates payload for marking a simulation as errored
   */
  static toErrorPayload(id: number, errorMessage?: string): SimulationSetOutputPayload {
    const payload: SimulationSetOutputPayload = {
      id,
      output: null,
      status: 'error',
    };
    if (errorMessage) {
      payload.error_message = errorMessage;
    }
    return payload;
  }

  /**
   * Creates payload for marking an economy simulation as complete with placeholder output
   * Economy simulations don't store individual outputs (only the report has aggregated output)
   */
  static toEconomyPlaceholderPayload(id: number): SimulationSetOutputPayload {
    return {
      id,
      output: JSON.stringify({
        message: 'Economy-wide reports do not save simulation-level results at this time',
      }),
      status: 'complete',
    };
  }
}
