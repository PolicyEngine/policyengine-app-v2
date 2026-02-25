import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

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
   * Converts SimulationMetadata from API GET response to Simulation type.
   *
   * @deprecated Use v2 simulation conversion functions (fromHouseholdSimulationResponse /
   * fromEconomySimulationResponse) instead. This remains for backward compatibility
   * with simulations created before the v2 migration.
   *
   * **Backward-compat note**: Users' existing v1 simulations remain in the v1 API
   * and are read through this path. Will be removed once v1 API endpoints are
   * decommissioned.
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
   * Converts Simulation to format for v1 API POST request.
   *
   * @deprecated Used only by the default baseline simulation shortcut in
   * ReportSimulationSelectionView. New report creation uses v2 analysis endpoints
   * which create simulations server-side.
   *
   * **Backward-compat note**: This v1 creation path is still used for the baseline
   * simulation shortcut. Will be removed once that shortcut uses v2 endpoints.
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

    // Map internal Simulation fields to V2-style payload
    if (simulation.populationType === 'geography') {
      return {
        region: simulation.populationId,
        policy_id: parseInt(simulation.policyId, 10),
      };
    }
    return {
      household_id: simulation.populationId,
      policy_id: parseInt(simulation.policyId, 10),
    };
  }
}
