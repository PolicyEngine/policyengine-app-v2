import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

/**
 * Fetch a simulation by ID from the v1 API.
 *
 * @deprecated Use v2 simulation endpoints (getHouseholdSimulation / getEconomySimulation)
 * instead. This remains for backward compatibility with simulations created before the
 * v2 migration. V2 reports fetch simulations via the typed v2 endpoints.
 */
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

/**
 * Create a simulation via the v1 API.
 *
 * @deprecated Used only by the default baseline simulation shortcut in
 * ReportSimulationSelectionView. New report creation uses v2 analysis endpoints
 * which create simulations server-side.
 */
export async function createSimulation(
  countryId: (typeof countryIds)[number],
  data: SimulationCreationPayload
): Promise<{ result: { simulation_id: string } }> {
  const url = `${BASE_URL}/${countryId}/simulation`;

  // Translate V2-style payload to V1 wire format
  const v1Payload = {
    population_id: data.region ?? data.household_id,
    population_type: data.region ? 'geography' : 'household',
    policy_id: data.policy_id,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(v1Payload),
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

  return {
    result: {
      simulation_id: String(json.result.id),
    },
  };
}
