import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
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
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch simulation ${simulationId}: ${response.status} ${response.statusText}`);
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
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
      simulation_id: String(json.result.id)
    }
  };
}
