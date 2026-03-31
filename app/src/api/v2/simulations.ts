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
import { cancellableSleep, v2Fetch } from './v2Fetch';

// ============================================================================
// Types
// ============================================================================

export type SimulationStatus =
  | 'pending'
  | 'execution_deferred'
  | 'running'
  | 'completed'
  | 'failed';

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
  country_id: string;
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
    case 'pending':
    case 'execution_deferred':
    case 'running':
      return 'pending';
    default:
      console.warn(`[v2 API] Unknown simulation status: "${status}", treating as pending`);
      return 'pending';
  }
}

/** Convert household simulation response to app Simulation */
export function fromHouseholdSimulationResponse(response: HouseholdSimulationResponse): Simulation {
  return {
    id: response.id,
    policyId: response.policy_id ?? undefined,
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
    policyId: response.policy_id ?? undefined,
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
  return v2Fetch<HouseholdSimulationResponse>(
    `${API_V2_BASE_URL}/simulations/household`,
    'createHouseholdSimulation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
}

/**
 * Get household simulation status and result.
 * GET /simulations/household/{simulation_id}
 * Throws with status code in message on any error (including 404).
 */
export async function getHouseholdSimulation(
  simulationId: string
): Promise<HouseholdSimulationResponse> {
  return v2Fetch<HouseholdSimulationResponse>(
    `${API_V2_BASE_URL}/simulations/household/${simulationId}`,
    `getHouseholdSimulation(${simulationId})`,
    {
      headers: { Accept: 'application/json' },
    }
  );
}

/**
 * Poll household simulation until completed or failed.
 * Supports AbortSignal for cancellation and retries transient errors up to 3 times.
 */
export async function pollHouseholdSimulation(
  simulationId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<HouseholdSimulationResponse> {
  const { pollIntervalMs = 1000, timeoutMs = 240000, signal } = options;
  const maxTransientRetries = 3;

  const startTime = Date.now();
  let consecutiveErrors = 0;

  while (Date.now() - startTime < timeoutMs) {
    let response: HouseholdSimulationResponse;
    try {
      response = await getHouseholdSimulation(simulationId);
      consecutiveErrors = 0;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      consecutiveErrors++;
      if (consecutiveErrors > maxTransientRetries) {
        throw error;
      }
      console.warn(
        `[v2 API] Transient error polling household simulation ${simulationId} (attempt ${consecutiveErrors}/${maxTransientRetries}):`,
        error
      );
      await cancellableSleep(pollIntervalMs, signal);
      continue;
    }

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Household simulation failed');
    }

    await cancellableSleep(pollIntervalMs, signal);
  }

  throw new Error(`Household simulation ${simulationId} timed out after ${timeoutMs / 1000}s`);
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
  return v2Fetch<EconomySimulationResponse>(
    `${API_V2_BASE_URL}/simulations/economy`,
    'createEconomySimulation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
}

/**
 * Get economy simulation status and result.
 * GET /simulations/economy/{simulation_id}
 * Throws with status code in message on any error (including 404).
 */
export async function getEconomySimulation(
  simulationId: string
): Promise<EconomySimulationResponse> {
  return v2Fetch<EconomySimulationResponse>(
    `${API_V2_BASE_URL}/simulations/economy/${simulationId}`,
    `getEconomySimulation(${simulationId})`,
    {
      headers: { Accept: 'application/json' },
    }
  );
}

/**
 * Poll economy simulation until completed or failed.
 * Supports AbortSignal for cancellation and retries transient errors up to 3 times.
 */
export async function pollEconomySimulation(
  simulationId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<EconomySimulationResponse> {
  const { pollIntervalMs = 2000, timeoutMs = 600000, signal } = options;
  const maxTransientRetries = 3;

  const startTime = Date.now();
  let consecutiveErrors = 0;

  while (Date.now() - startTime < timeoutMs) {
    let response: EconomySimulationResponse;
    try {
      response = await getEconomySimulation(simulationId);
      consecutiveErrors = 0;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      consecutiveErrors++;
      if (consecutiveErrors > maxTransientRetries) {
        throw error;
      }
      console.warn(
        `[v2 API] Transient error polling economy simulation ${simulationId} (attempt ${consecutiveErrors}/${maxTransientRetries}):`,
        error
      );
      await cancellableSleep(pollIntervalMs, signal);
      continue;
    }

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Economy simulation failed');
    }

    await cancellableSleep(pollIntervalMs, signal);
  }

  throw new Error(`Economy simulation ${simulationId} timed out after ${timeoutMs / 1000}s`);
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
  const response = await v2Fetch<GenericSimulationResponse>(
    `${API_V2_BASE_URL}/simulations/${simulationId}`,
    `fetchSimulationByIdV2(${simulationId})`,
    {
      headers: { Accept: 'application/json' },
    }
  );

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
