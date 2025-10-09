import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

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

  return json.result;
}

export async function createSimulation(
  countryId: (typeof countryIds)[number],
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  const url = `${BASE_URL}/${countryId}/simulation`;

  console.log('Creating simulation with data:', data); // Debug log

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
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
 * Update a simulation with calculation output
 * NOTE: Follows the same pattern as report PATCH endpoint (ID in payload, not URL)
 *
 * @param countryId - The country ID
 * @param simulationId - The simulation ID
 * @param simulation - The simulation object with output
 * @returns The updated simulation metadata
 */
export async function updateSimulationOutput(
  countryId: (typeof countryIds)[number],
  simulationId: string,
  simulation: Simulation
): Promise<SimulationMetadata> {
  const url = `${BASE_URL}/${countryId}/simulation`;

  console.log('[updateSimulationOutput] Updating simulation:', simulationId, 'with output');

  const payload = {
    id: parseInt(simulationId, 10),
    output_json: simulation.output ? JSON.stringify(simulation.output.householdData) : null,
  };

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

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse simulation update response: ${error}`);
  }

  if (json.status !== 'ok') {
    throw new Error(json.message || `Failed to update simulation ${simulationId}`);
  }

  return json.result;
}
