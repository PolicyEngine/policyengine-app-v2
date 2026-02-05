/**
 * User Household Associations API - v2 Alpha
 *
 * Handles CRUD operations for user-household associations via API v2 alpha.
 * These associations link users to their saved households.
 *
 * API Endpoints (from policyengine-api-v2-alpha PR #77):
 * - POST   /user-household-associations/                     - Create association
 * - GET    /user-household-associations/user/{user_id}       - List by user (optional country_id query)
 * - GET    /user-household-associations/{user_id}/{household_id} - List by user+household
 * - PUT    /user-household-associations/{association_id}     - Update association
 * - DELETE /user-household-associations/{association_id}     - Delete association
 */

import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types for v2 Alpha API
// ============================================================================

/**
 * API response format (snake_case) - matches UserHouseholdAssociationRead
 */
export interface UserHouseholdAssociationV2Response {
  id: string;
  user_id: string;
  household_id: string;
  country_id: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * API request format for creating associations - matches UserHouseholdAssociationCreate
 */
export interface UserHouseholdAssociationV2CreateRequest {
  user_id: string;
  household_id: string;
  country_id: string;
  label?: string | null;
}

/**
 * API request format for updating associations - matches UserHouseholdAssociationUpdate
 */
export interface UserHouseholdAssociationV2UpdateRequest {
  label?: string | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert app format to v2 API create request
 */
export function toV2CreateRequest(
  association: Omit<UserHouseholdPopulation, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'isCreated'>
): UserHouseholdAssociationV2CreateRequest {
  return {
    user_id: association.userId,
    household_id: association.householdId,
    country_id: association.countryId,
    label: association.label ?? null,
  };
}

/**
 * Convert v2 API response to app format
 */
export function fromV2Response(response: UserHouseholdAssociationV2Response): UserHouseholdPopulation {
  return {
    type: 'household',
    id: response.id,
    userId: response.user_id,
    householdId: response.household_id,
    countryId: response.country_id as UserHouseholdPopulation['countryId'],
    label: response.label ?? undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at ?? undefined,
    isCreated: true,
  };
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_PATH = '/user-household-associations';

/**
 * Create a new user-household association
 * POST /user-household-associations/
 */
export async function createUserHouseholdAssociationV2(
  association: Omit<UserHouseholdPopulation, 'id' | 'type' | 'createdAt' | 'updatedAt' | 'isCreated'>
): Promise<UserHouseholdPopulation> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/`;
  const body = toV2CreateRequest(association);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create household association: ${res.status} ${errorText}`);
  }

  const json: UserHouseholdAssociationV2Response = await res.json();
  return fromV2Response(json);
}

/**
 * Fetch associations by user ID, optionally filtered by country
 * GET /user-household-associations/user/{user_id}?country_id={country_id}
 */
export async function fetchUserHouseholdAssociationsV2(
  userId: string,
  countryId?: string
): Promise<UserHouseholdPopulation[]> {
  let url = `${API_V2_BASE_URL}${BASE_PATH}/user/${userId}`;
  if (countryId) {
    url += `?country_id=${encodeURIComponent(countryId)}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch household associations: ${res.status} ${errorText}`);
  }

  const json: UserHouseholdAssociationV2Response[] = await res.json();
  return json.map(fromV2Response);
}

/**
 * Fetch associations by user ID and household ID
 * GET /user-household-associations/{user_id}/{household_id}
 * Returns a list (could have multiple associations for same user+household with different labels)
 */
export async function fetchUserHouseholdAssociationByIdV2(
  userId: string,
  householdId: string
): Promise<UserHouseholdPopulation | null> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userId}/${householdId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch household association: ${res.status} ${errorText}`);
  }

  const json: UserHouseholdAssociationV2Response[] = await res.json();
  if (json.length === 0) {
    return null;
  }

  // Return the first match (typically there's only one, but API supports multiple)
  return fromV2Response(json[0]);
}

/**
 * Update an existing association
 * PUT /user-household-associations/{association_id}
 */
export async function updateUserHouseholdAssociationV2(
  associationId: string,
  updates: UserHouseholdAssociationV2UpdateRequest
): Promise<UserHouseholdPopulation> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${associationId}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update household association: ${res.status} ${errorText}`);
  }

  const json: UserHouseholdAssociationV2Response = await res.json();
  return fromV2Response(json);
}

/**
 * Delete an association
 * DELETE /user-household-associations/{association_id}
 */
export async function deleteUserHouseholdAssociationV2(associationId: string): Promise<void> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${associationId}`;

  const res = await fetch(url, {
    method: 'DELETE',
  });

  // API returns 204 on success, 404 if not found (both are acceptable for delete)
  if (!res.ok && res.status !== 404) {
    const errorText = await res.text();
    throw new Error(`Failed to delete household association: ${res.status} ${errorText}`);
  }
}
