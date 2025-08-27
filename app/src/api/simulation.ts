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
        resolve({
          simulation_id: simulationId,
          country_id: countryId,
          api_version: mockApiVersion,
          population_id: mockPopulationId,
          population_type: 'household' as const, // Default to household for legacy simulations
          policy_id: mockPolicyId,
        });
      }
    }, 1000); // Simulate network delay
  });
}

export async function createSimulation(
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a unique simulation ID
      const simulationId = `mock-simulation-id-${Date.now()}`;

      // Store the simulation data for later retrieval
      const simulationMetadata: SimulationMetadata = {
        simulation_id: simulationId,
        country_id: 'us', // Default to US for now
        api_version: mockApiVersion,
        population_id: data.population_id || mockPopulationId,
        population_type: data.population_type || 'household', // Use provided type or default to household
        policy_id: data.policy_id || mockPolicyId,
      };

      mockSimulationStore.set(simulationId, simulationMetadata);

      resolve({ result: { simulation_id: simulationId } });
    }, 1000); // Simulate network delay
  });
}
