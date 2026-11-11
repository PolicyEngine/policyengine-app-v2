import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { canonicalRegionCode } from '@/models/region';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

/**
 * A geography simulation's population is a region code: the code the app
 * uses for it, so a simulation saved for "country/ni" reads, and is sent,
 * as "country/northern_ireland". A household's ID is kept as it is.
 */
function withCanonicalPopulationId<
  SimulationRecord extends Pick<SimulationCreationPayload, 'population_id' | 'population_type'>,
>(simulation: SimulationRecord): SimulationRecord {
  if (
    !simulation ||
    simulation.population_type !== 'geography' ||
    typeof simulation.population_id !== 'string'
  ) {
    return simulation;
  }

  return { ...simulation, population_id: canonicalRegionCode(simulation.population_id) };
}

export async function fetchSimulationById(
  countryId: (typeof countryIds)[number],
  simulationId: string
): Promise<SimulationMetadata> {
  const url = `${BASE_URL}/${countryId}/simulation/${simulationId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch simulation ${simulationId}: ${response.status} ${response.statusText}`
    );
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse simulation response: ${error}`);
  }

  if (json.status !== 'ok') {
    throw new Error(json.message || `Failed to fetch simulation ${simulationId}`);
  }

  return withCanonicalPopulationId(json.result);
}

export async function createSimulation(
  countryId: (typeof countryIds)[number],
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  const url = `${BASE_URL}/${countryId}/simulation`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(withCanonicalPopulationId(data)),
  });

  if (!response.ok) {
    throw new Error(`Failed to create simulation: ${response.status} ${response.statusText}`);
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse simulation response: ${error}`);
  }

  if (json.status !== 'ok') {
    throw new Error(json.message || 'Failed to create simulation');
  }

  // Transform response to match existing interface
  return {
    result: {
      simulation_id: String(json.result.id),
    },
  };
}

/**
 * Update simulation output after calculation completes
 * Note: Simulation PATCH uses ID in body, not URL (same as reports)
 */
export async function updateSimulationOutput(
  countryId: (typeof countryIds)[number],
  simulationId: string,
  output: unknown
): Promise<SimulationMetadata> {
  const url = `${BASE_URL}/${countryId}/simulation`;

  const payload = SimulationAdapter.toCompletedPayload(parseInt(simulationId, 10), output);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update simulation ${simulationId}: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.status !== 'ok') {
    throw new Error(json.message || `Failed to update simulation ${simulationId}`);
  }

  return withCanonicalPopulationId(json.result);
}

/**
 * Mark a simulation as completed with its output
 * Convenience wrapper around updateSimulationOutput
 */
export async function markSimulationCompleted(
  countryId: (typeof countryIds)[number],
  simulationId: string,
  output: unknown
): Promise<SimulationMetadata> {
  return updateSimulationOutput(countryId, simulationId, output);
}

/**
 * Mark a simulation as errored
 * Note: Simulation PATCH uses ID in body, not URL (same as reports)
 */
export async function markSimulationError(
  countryId: (typeof countryIds)[number],
  simulationId: string,
  errorMessage?: string,
  errorCode?: string
): Promise<SimulationMetadata> {
  const url = `${BASE_URL}/${countryId}/simulation`;

  const payload = SimulationAdapter.toErrorPayload(
    parseInt(simulationId, 10),
    errorMessage,
    errorCode
  );

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to mark simulation ${simulationId} as error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.status !== 'ok') {
    throw new Error(json.message || `Failed to mark simulation ${simulationId} as error`);
  }

  return withCanonicalPopulationId(json.result);
}
