/**
 * User Simulation Associations API - v2 Alpha
 *
 * Handles CRUD operations for user-simulation associations via API v2 alpha.
 * These associations link users to their saved simulations.
 *
 * API Endpoints:
 * - POST   /user-simulations/                              - Create association
 * - GET    /user-simulations/?user_id=...&country_id=...   - List by user
 * - GET    /user-simulations/{id}                          - Get by ID
 * - PATCH  /user-simulations/{id}?user_id=...              - Update (ownership verified)
 * - DELETE /user-simulations/{id}?user_id=...              - Delete (ownership verified)
 */

import { CountryId } from '@/libs/countries';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch, v2FetchVoid } from './v2Fetch';

// ============================================================================
// Types for v2 Alpha API
// ============================================================================

/** API response format (snake_case) - matches backend UserSimulationAssociationRead */
export interface UserSimulationAssociationV2Response {
  id: string;
  user_id: string;
  simulation_id: string;
  country_id: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

/** API request format for creating associations */
export interface UserSimulationAssociationV2CreateRequest {
  user_id: string;
  simulation_id: string;
  country_id: string;
  label?: string | null;
}

/** API request format for updating associations */
export interface UserSimulationAssociationV2UpdateRequest {
  label?: string | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/** Convert app format to v2 API create request */
export function toV2CreateRequest(
  association: Omit<UserSimulation, 'id' | 'createdAt' | 'updatedAt' | 'isCreated'>
): UserSimulationAssociationV2CreateRequest {
  return {
    user_id: association.userId,
    simulation_id: association.simulationId,
    country_id: association.countryId,
    label: association.label ?? null,
  };
}

/** Convert v2 API response to app format */
export function fromV2Response(response: UserSimulationAssociationV2Response): UserSimulation {
  return {
    id: response.id,
    userId: response.user_id,
    simulationId: response.simulation_id,
    countryId: response.country_id as CountryId,
    label: response.label ?? undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at ?? undefined,
    isCreated: true,
  };
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_PATH = '/user-simulations';

/**
 * Create a new user-simulation association.
 * POST /user-simulations/
 */
export async function createUserSimulationAssociationV2(
  association: Omit<UserSimulation, 'id' | 'createdAt' | 'updatedAt' | 'isCreated'>
): Promise<UserSimulation> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/`;
  const body = toV2CreateRequest(association);

  const json = await v2Fetch<UserSimulationAssociationV2Response>(
    url,
    'createUserSimulationAssociation',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  return fromV2Response(json);
}

/**
 * Fetch associations by user ID, optionally filtered by country.
 * GET /user-simulations/?user_id=...&country_id=...
 */
export async function fetchUserSimulationAssociationsV2(
  userId: string,
  countryId?: string
): Promise<UserSimulation[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (countryId) {
    params.append('country_id', countryId);
  }

  const url = `${API_V2_BASE_URL}${BASE_PATH}/?${params}`;

  const json = await v2Fetch<UserSimulationAssociationV2Response[]>(
    url,
    'fetchUserSimulationAssociations',
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );
  return json.map(fromV2Response);
}

/**
 * Fetch a single association by its ID.
 * GET /user-simulations/{id}
 */
export async function fetchUserSimulationAssociationByIdV2(
  userSimulationId: string
): Promise<UserSimulation | null> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userSimulationId}`;

  const json = await v2Fetch<UserSimulationAssociationV2Response | null>(
    url,
    'fetchUserSimulationAssociationById',
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      nullOn404: true,
    }
  );
  return json ? fromV2Response(json) : null;
}

/**
 * Update an existing association.
 * PATCH /user-simulations/{id}?user_id=...
 *
 * Backend requires user_id as query param for ownership verification.
 */
export async function updateUserSimulationAssociationV2(
  userSimulationId: string,
  userId: string,
  updates: UserSimulationAssociationV2UpdateRequest
): Promise<UserSimulation> {
  const params = new URLSearchParams({ user_id: userId });
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userSimulationId}?${params}`;

  const json = await v2Fetch<UserSimulationAssociationV2Response>(
    url,
    'updateUserSimulationAssociation',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );
  return fromV2Response(json);
}

/**
 * Delete an association.
 * DELETE /user-simulations/{id}?user_id=...
 *
 * Backend requires user_id as query param for ownership verification.
 */
export async function deleteUserSimulationAssociationV2(
  userSimulationId: string,
  userId: string
): Promise<void> {
  const params = new URLSearchParams({ user_id: userId });
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userSimulationId}?${params}`;

  await v2FetchVoid(url, 'deleteUserSimulationAssociation', {
    method: 'DELETE',
    allowNotFound: true,
  });
}
