/**
 * User Report Associations API - v2 Alpha
 *
 * Handles CRUD operations for user-report associations via API v2 alpha.
 * These associations link users to their saved reports.
 *
 * API Endpoints:
 * - POST   /user-reports/                              - Create association
 * - GET    /user-reports/?user_id=...&country_id=...   - List by user
 * - GET    /user-reports/{id}                          - Get by ID
 * - PATCH  /user-reports/{id}?user_id=...              - Update (ownership verified)
 * - DELETE /user-reports/{id}?user_id=...              - Delete (ownership verified)
 */

import { CountryId } from '@/libs/countries';
import { UserReport } from '@/types/ingredients/UserReport';
import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types for v2 Alpha API
// ============================================================================

/** API response format (snake_case) - matches backend UserReportAssociationRead */
export interface UserReportAssociationV2Response {
  id: string;
  user_id: string;
  report_id: string;
  country_id: string;
  label: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

/** API request format for creating associations */
export interface UserReportAssociationV2CreateRequest {
  user_id: string;
  report_id: string;
  country_id: string;
  label?: string | null;
}

/** API request format for updating associations */
export interface UserReportAssociationV2UpdateRequest {
  label?: string | null;
  last_run_at?: string | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/** Convert app format to v2 API create request */
export function toV2CreateRequest(
  association: Omit<UserReport, 'id' | 'createdAt' | 'updatedAt' | 'isCreated'>
): UserReportAssociationV2CreateRequest {
  return {
    user_id: association.userId,
    report_id: association.reportId,
    country_id: association.countryId,
    label: association.label ?? null,
  };
}

/** Convert v2 API response to app format */
export function fromV2Response(response: UserReportAssociationV2Response): UserReport {
  return {
    id: response.id,
    userId: response.user_id,
    reportId: response.report_id,
    countryId: response.country_id as CountryId,
    label: response.label ?? undefined,
    lastRunAt: response.last_run_at ?? undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at ?? undefined,
    isCreated: true,
  };
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_PATH = '/user-reports';

/**
 * Create a new user-report association.
 * POST /user-reports/
 */
export async function createUserReportAssociationV2(
  association: Omit<UserReport, 'id' | 'createdAt' | 'updatedAt' | 'isCreated'>
): Promise<UserReport> {
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
    throw new Error(`Failed to create report association: ${res.status} ${errorText}`);
  }

  const json: UserReportAssociationV2Response = await res.json();
  return fromV2Response(json);
}

/**
 * Fetch associations by user ID, optionally filtered by country.
 * GET /user-reports/?user_id=...&country_id=...
 */
export async function fetchUserReportAssociationsV2(
  userId: string,
  countryId?: string
): Promise<UserReport[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (countryId) {
    params.append('country_id', countryId);
  }

  const url = `${API_V2_BASE_URL}${BASE_PATH}/?${params}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch report associations: ${res.status} ${errorText}`);
  }

  const json: UserReportAssociationV2Response[] = await res.json();
  return json.map(fromV2Response);
}

/**
 * Fetch a single association by its ID.
 * GET /user-reports/{id}
 */
export async function fetchUserReportAssociationByIdV2(
  userReportId: string
): Promise<UserReport | null> {
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userReportId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch report association: ${res.status} ${errorText}`);
  }

  const json: UserReportAssociationV2Response = await res.json();
  return fromV2Response(json);
}

/**
 * Update an existing association.
 * PATCH /user-reports/{id}?user_id=...
 *
 * Backend requires user_id as query param for ownership verification.
 */
export async function updateUserReportAssociationV2(
  userReportId: string,
  userId: string,
  updates: UserReportAssociationV2UpdateRequest
): Promise<UserReport> {
  const params = new URLSearchParams({ user_id: userId });
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userReportId}?${params}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update report association: ${res.status} ${errorText}`);
  }

  const json: UserReportAssociationV2Response = await res.json();
  return fromV2Response(json);
}

/**
 * Delete an association.
 * DELETE /user-reports/{id}?user_id=...
 *
 * Backend requires user_id as query param for ownership verification.
 */
export async function deleteUserReportAssociationV2(
  userReportId: string,
  userId: string
): Promise<void> {
  const params = new URLSearchParams({ user_id: userId });
  const url = `${API_V2_BASE_URL}${BASE_PATH}/${userReportId}?${params}`;

  const res = await fetch(url, {
    method: 'DELETE',
  });

  // API returns 204 on success, 404 if not found (both are acceptable for delete)
  if (!res.ok && res.status !== 404) {
    const errorText = await res.text();
    throw new Error(`Failed to delete report association: ${res.status} ${errorText}`);
  }
}
