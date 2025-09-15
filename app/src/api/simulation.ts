import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

// The required API endpoint to fetch a simulation by ID
// doesn't exist yet. The code below will be used once the endpoint is created.
/*
export async function fetchSimulationById(
  country: string,
  simulationId: string
): Promise<SimulationMetadata> {
  const url = `${BASE_URL}/${country}/simulation/${simulationId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch simulation ${simulationId}`);
  }

  const json = await res.json();

  return json.result;
}
*/

// The required API endpoint to create a simulation doesn't
// exist yet. The code below will be used once the endpoint is created.
/*
export async function createSimulation(
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  const url = `${BASE_URL}/us/simulation`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create simulation');
  }

  return res.json();
}
*/

// TODO: This needs fixing once we have a simulation endpoint on API.
const mockApiVersion = 'mock-api-version';
const mockPopulationId = '55453';
const mockPolicyId = '14';

// Store created simulations to return proper data when fetched
const mockSimulationStore = new Map<string, SimulationMetadata>();

export async function fetchSimulationById(
  countryId: (typeof countryIds)[number],
  simulationId: string
): Promise<SimulationMetadata> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check if we have stored data for this simulation
      const storedSimulation = mockSimulationStore.get(simulationId);
      if (storedSimulation) {
        resolve(storedSimulation);
      } else {
        // Fallback for simulations not in our store (legacy or external)
        // TODO: Remove this once we have the necessary API endpoints
        resolve({
          id: parseInt(simulationId, 10),
          country_id: countryId,
          api_version: mockApiVersion,
          population_id: mockPopulationId,
          population_type: 'household' as const,
          policy_id: mockPolicyId,
        });
      }
    }, 1000); // Simulate network delay
  });
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
