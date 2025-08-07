import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { SimulationMetadata } from '@/types/simulationMetadata';
import { SimulationCreationPayload } from '@/types/simulationPayload';

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

const mockSimulationId = `mock-simulation-id-${Date.now()}`; 
const mockCountryId = 'us'; 
const mockApiVersion = 'mock-api-version'; 
const mockPopulationId = 1; 
const mockPolicyId = 89013;

export async function fetchSimulationById(
  countryId: typeof countryIds[number],
  simulationId: string
): Promise<SimulationMetadata> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        simulation_id: simulationId,
        country_id: countryId,
        api_version: mockApiVersion,
        population_id: mockPopulationId,
        policy_id: mockPolicyId,
      });
    }, 1000); // Simulate network delay
  });
}

export async function createSimulation(
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ result: { simulation_id: mockSimulationId } });
    }, 1000); // Simulate network delay
  });
}
