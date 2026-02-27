/**
 * Simulations API - v2 Alpha
 *
 * Handles creation and polling of simulations via the API v2 alpha.
 * Simulations combine a policy with a population (household or economy-wide dataset).
 *
 * API Endpoints:
 * - POST /simulations/household            - Create household simulation
 * - GET  /simulations/household/{id}       - Get household simulation status/result
 * - POST /simulations/economy              - Create economy simulation
 * - GET  /simulations/economy/{id}         - Get economy simulation status/result
 */

import { Simulation } from '@/types/ingredients/Simulation';
import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types
// ============================================================================

export type SimulationStatus = 'pending' | 'running' | 'completed' | 'failed';

/** POST /simulations/household request body */
export interface HouseholdSimulationRequest {
  household_id: string;
  policy_id?: string | null;
  dynamic_id?: string | null;
}

/** Response from POST and GET /simulations/household */
export interface HouseholdSimulationResponse {
  id: string;
  status: SimulationStatus;
  household_id: string | null;
  policy_id: string | null;
  household_result: Record<string, any> | null;
  error_message: string | null;
}

/** POST /simulations/economy request body */
export interface EconomySimulationRequest {
  tax_benefit_model_name: string;
  region?: string | null;
  dataset_id?: string | null;
  policy_id?: string | null;
  dynamic_id?: string | null;
}

/** Region info nested in economy simulation response */
export interface RegionInfo {
  code: string;
  name: string;
  dataset_id: string;
  filter_field: string | null;
  filter_value: string | null;
}

/** Response from POST and GET /simulations/economy */
export interface EconomySimulationResponse {
  id: string;
  status: SimulationStatus;
  dataset_id: string | null;
  policy_id: string | null;
  output_dataset_id: string | null;
  filter_field: string | null;
  filter_value: string | null;
  region: RegionInfo | null;
  error_message: string | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/** Map API status to app domain status */
function toAppStatus(status: SimulationStatus): Simulation['status'] {
  switch (status) {
    case 'completed':
      return 'complete';
    case 'failed':
      return 'error';
    default:
      return 'pending';
  }
}

/** Convert household simulation response to app Simulation */
export function fromHouseholdSimulationResponse(response: HouseholdSimulationResponse): Simulation {
  return {
    id: response.id,
    policyId: response.policy_id,
    populationId: response.household_id ?? undefined,
    populationType: 'household',
    label: null,
    isCreated: true,
    output: response.household_result,
    status: toAppStatus(response.status),
  };
}

/** Convert economy simulation response to app Simulation */
export function fromEconomySimulationResponse(response: EconomySimulationResponse): Simulation {
  return {
    id: response.id,
    policyId: response.policy_id,
    populationId: response.region?.code ?? response.dataset_id ?? undefined,
    populationType: 'geography',
    label: null,
    isCreated: true,
    status: toAppStatus(response.status),
  };
}

// ============================================================================
// Household Simulation API Functions
// ============================================================================

/**
 * Create a household simulation.
 * POST /simulations/household
 */
export async function createHouseholdSimulation(
  request: HouseholdSimulationRequest
): Promise<HouseholdSimulationResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/simulations/household`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create household simulation: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Get household simulation status and result.
 * GET /simulations/household/{simulation_id}
 */
export async function getHouseholdSimulation(
  simulationId: string
): Promise<HouseholdSimulationResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/simulations/household/${simulationId}`, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    throw new Error(`Household simulation ${simulationId} not found`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get household simulation: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Poll household simulation until completed or failed.
 */
export async function pollHouseholdSimulation(
  simulationId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<HouseholdSimulationResponse> {
  const { pollIntervalMs = 1000, timeoutMs = 240000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await getHouseholdSimulation(simulationId);

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Household simulation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Household simulation timed out');
}

// ============================================================================
// Economy Simulation API Functions
// ============================================================================

/**
 * Create an economy simulation.
 * POST /simulations/economy
 */
export async function createEconomySimulation(
  request: EconomySimulationRequest
): Promise<EconomySimulationResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/simulations/economy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create economy simulation: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Get economy simulation status and result.
 * GET /simulations/economy/{simulation_id}
 */
export async function getEconomySimulation(
  simulationId: string
): Promise<EconomySimulationResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/simulations/economy/${simulationId}`, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    throw new Error(`Economy simulation ${simulationId} not found`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get economy simulation: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Poll economy simulation until completed or failed.
 */
export async function pollEconomySimulation(
  simulationId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<EconomySimulationResponse> {
  const { pollIntervalMs = 2000, timeoutMs = 600000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await getEconomySimulation(simulationId);

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Economy simulation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Economy simulation timed out');
}

// ============================================================================
// Generic V2 Simulation Fetch
// ============================================================================

/** Response from GET /simulations/{id} (generic endpoint) */
interface GenericSimulationResponse {
  id: string;
  simulation_type: 'household' | 'economy';
  status: SimulationStatus;
  dataset_id: string | null;
  household_id: string | null;
  policy_id: string | null;
  output_dataset_id: string | null;
  filter_field: string | null;
  filter_value: string | null;
  household_result: Record<string, any> | null;
  error_message: string | null;
}

/**
 * Fetch a v2 simulation by ID using the generic endpoint.
 * GET /simulations/{id} returns `simulation_type` so we can convert
 * to the correct app domain type in a single request.
 */
export async function fetchSimulationByIdV2(simulationId: string): Promise<Simulation> {
  const res = await fetch(`${API_V2_BASE_URL}/simulations/${simulationId}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get simulation: ${res.status} ${errorText}`);
  }

  const response: GenericSimulationResponse = await res.json();

  if (response.simulation_type === 'household') {
    return fromHouseholdSimulationResponse({
      id: response.id,
      status: response.status,
      household_id: response.household_id,
      policy_id: response.policy_id,
      household_result: response.household_result,
      error_message: response.error_message,
    });
  }

  return fromEconomySimulationResponse({
    id: response.id,
    status: response.status,
    dataset_id: response.dataset_id,
    policy_id: response.policy_id,
    output_dataset_id: response.output_dataset_id,
    filter_field: response.filter_field,
    filter_value: response.filter_value,
    region: null,
    error_message: response.error_message,
  });
}
