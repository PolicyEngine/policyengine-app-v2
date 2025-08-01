import { BASE_URL } from '@/constants';
import { SimulationMetadata } from '@/types/simulationMetadata';
import { SimulationCreationPayload } from '@/types/simulationPayload';

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
