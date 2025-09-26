import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';
import { simulationsAPI } from './v2/simulations';

export async function fetchSimulationById(
  countryId: (typeof countryIds)[number],
  simulationId: string
): Promise<SimulationMetadata> {
  const simulation = await simulationsAPI.get(simulationId);
  // Transform to expected format
  return {
    id: simulation.id,
    country_id: countryId,
    policy_id: simulation.policy_id,
    status: simulation.status,
    results: simulation.results,
    error: simulation.error,
  } as SimulationMetadata;
}

export async function createSimulation(
  countryId: (typeof countryIds)[number],
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  const simulation = await simulationsAPI.createAndRun({
    name: data.label,
    description: data.baseline_policy_id ? `Based on baseline ${data.baseline_policy_id}` : undefined,
    policy_id: data.reform_policy_id || data.baseline_policy_id || '',
    dataset_id: data.dataset_id,
    model_id: data.model_id,
    model_version_id: data.model_version_id,
  });

  return {
    result: {
      simulation_id: simulation.id,
    },
  };
}
