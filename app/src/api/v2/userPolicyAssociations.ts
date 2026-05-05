/**
 * User Policy Associations API - v2 Alpha
 *
 * Handles CRUD operations for user-policy associations via API v2 alpha.
 * These associations link users to their saved policies.
 *
 * API Endpoints (from policyengine-api-v2-alpha):
 * - POST   /user-policies/                          - Create association
 * - GET    /user-policies/?user_id=...&country_id=.. - List by user (optional country_id filter)
 * - GET    /user-policies/{user_policy_id}           - Get by ID
 * - PATCH  /user-policies/{user_policy_id}?user_id=. - Update association (ownership verified)
 * - DELETE /user-policies/{user_policy_id}?user_id=. - Delete association (ownership verified)
 */

import { CountryId } from '@/libs/countries';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch, v2FetchVoid } from './v2Fetch';

// ============================================================================
// Types for v2 Alpha API
// ============================================================================

/**
 * API response format (snake_case) - matches backend UserPolicyRead
 */
export interface UserPolicyAssociationV2Response {
  id: string;
  user_id: string;
  policy_id: string;
  country_id: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * API request format for creating associations - matches backend UserPolicyCreate
 */
export interface UserPolicyAssociationV2CreateRequest {
  user_id: string;
  policy_id: string;
  country_id: string;
  label?: string | null;
}

/**
 * API request format for updating associations - matches backend UserPolicyUpdate
 */
export interface UserPolicyAssociationV2UpdateRequest {
  policy_id?: string;
  label?: string | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert app format to v2 API create request
 */
export function toV2CreateRequest(
  userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>
): UserPolicyAssociationV2CreateRequest {
  return {
    user_id: userPolicy.userId,
    policy_id: userPolicy.policyId,
    country_id: userPolicy.countryId,
    label: userPolicy.label ?? null,
  };
}

/**
 * Convert v2 API response to app format
 */
export function fromV2Response(response: UserPolicyAssociationV2Response): UserPolicy {
  return {
    id: response.id,
    userId: response.user_id,
    policyId: response.policy_id,
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

const BASE_PATH = '/user-policies';

/**
 * Create a new user-policy association
 * POST /user-policies/
 */
export async function createUserPolicyAssociationV2(
  userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>
): Promise<UserPolicy> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/`;
  const body = toV2CreateRequest(userPolicy);

  const json = await v2Fetch<UserPolicyAssociationV2Response>(url, 'createUserPolicyAssociation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return fromV2Response(json);
}

/**
 * Fetch associations by user ID, optionally filtered by country
 * GET /user-policies/?user_id=...&country_id=...
 */
export async function fetchUserPolicyAssociationsV2(
  userId: string,
  countryId?: string
): Promise<UserPolicy[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (countryId) {
    params.append('country_id', countryId);
  }

  const url = `${API_V2_BASE_URL}${BASE_PATH}/?${params}`;

  const json = await v2Fetch<UserPolicyAssociationV2Response[]>(
    url,
    'fetchUserPolicyAssociations',
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );
  return json.map(fromV2Response);
}

/**
 * Fetch a single association by its ID
 * GET /user-policies/{user_policy_id}
 */
export async function fetchUserPolicyAssociationByIdV2(
  userPolicyId: string
): Promise<UserPolicy | null> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userPolicyId}`;

  const json = await v2Fetch<UserPolicyAssociationV2Response | null>(
    url,
    'fetchUserPolicyAssociationById',
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      nullOn404: true,
    }
  );
  return json ? fromV2Response(json) : null;
}

/**
 * Update an existing association
 * PATCH /user-policies/{user_policy_id}?user_id=...
 *
 * Backend requires user_id as query param for ownership verification.
 */
export async function updateUserPolicyAssociationV2(
  userPolicyId: string,
  userId: string,
  updates: UserPolicyAssociationV2UpdateRequest
): Promise<UserPolicy> {
  const params = new URLSearchParams({ user_id: userId });
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userPolicyId}?${params}`;

  const json = await v2Fetch<UserPolicyAssociationV2Response>(url, 'updateUserPolicyAssociation', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return fromV2Response(json);
}

/**
 * Delete an association
 * DELETE /user-policies/{user_policy_id}?user_id=...
 *
 * Backend requires user_id as query param for ownership verification.
 */
export async function deleteUserPolicyAssociationV2(
  userPolicyId: string,
  userId: string
): Promise<void> {
  const params = new URLSearchParams({ user_id: userId });
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userPolicyId}?${params}`;

  await v2FetchVoid(url, 'deleteUserPolicyAssociation', {
    method: 'DELETE',
    allowNotFound: true,
  });
}
