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
    console.log('[SimulationAdapter.fromMetadata] RAW API METADATA:', {
      id: metadata.id,
      status: metadata.status,
      hasOutput: !!metadata.output,
      metadataKeys: Object.keys(metadata),
    });

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

    const simulation = {
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

    console.log('[SimulationAdapter.fromMetadata] TRANSFORMED SIMULATION:', {
      id: simulation.id,
      status: simulation.status,
      hasOutput: !!simulation.output,
      simulationKeys: Object.keys(simulation),
    });

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
   * Note: Simulation PATCH includes id in body
   * Note: Now accepts status field (matching report PATCH format)
   */
  static toUpdatePayload(
    simulationId: string,
    output: unknown,
    status: 'pending' | 'complete' | 'error'
  ): SimulationSetOutputPayload {
    return {
      id: parseInt(simulationId, 10),
      status,
      output: output ? JSON.stringify(output) : null,
    };
  }

  /**
   * Creates payload for marking a simulation as completed with output
   */
  static toCompletedPayload(simulationId: string, output: unknown): SimulationSetOutputPayload {
    return {
      id: parseInt(simulationId, 10),
      status: 'complete',
      output: JSON.stringify(output),
    };
  }

  /**
   * Creates payload for marking a simulation as errored
   */
  static toErrorPayload(simulationId: string, errorMessage?: string): SimulationSetOutputPayload {
    return {
      id: parseInt(simulationId, 10),
      status: 'error',
      output: null,
      error_message: errorMessage || null,
    };
  }

  /**
   * Creates payload for marking an economy simulation as complete with placeholder output
   * Economy simulations don't store individual outputs (only the report has aggregated output)
   */
  static toEconomyPlaceholderPayload(simulationId: string): SimulationSetOutputPayload {
    return {
      id: parseInt(simulationId, 10),
      status: 'complete',
      output: JSON.stringify({
        message: "Economy-wide reports do not save simulation-level results at this time"
      }),
    };
  }
}
