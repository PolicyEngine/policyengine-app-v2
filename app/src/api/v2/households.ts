/**
 * Households API - v2 Alpha CRUD operations
 *
 * This module handles all communication with the API v2 Alpha /households endpoints.
 * These endpoints manage stored household definitions (CRUD), not calculations.
 *
 * For running calculations on a household, use householdCalculation.ts instead.
 */

import type { CountryId } from '@/libs/countries';
import type { V2HouseholdShape } from './householdCalculation';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch, v2FetchVoid } from './v2Fetch';

// ============================================================================
// Types for v2 Alpha /households API
// ============================================================================

/**
 * Response from v2 alpha household endpoints (HouseholdRead schema)
 */
export interface HouseholdV2Response {
  id: string; // UUID
  country_id: CountryId;
  year: number;
  label: string | null;
  people: Record<string, any>[];
  tax_unit?: Record<string, any> | null;
  family?: Record<string, any> | null;
  spm_unit?: Record<string, any> | null;
  marital_unit?: Record<string, any> | null;
  household?: Record<string, any> | null;
  benunit?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating a household (HouseholdCreate schema)
 */
export interface HouseholdV2CreateRequest {
  country_id: CountryId;
  year: number;
  label?: string | null;
  people: Record<string, any>[];
  tax_unit?: Record<string, any> | null;
  family?: Record<string, any> | null;
  spm_unit?: Record<string, any> | null;
  marital_unit?: Record<string, any> | null;
  household?: Record<string, any> | null;
  benunit?: Record<string, any> | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert app Household to v2 alpha API request format
 */
export function householdToV2Request(household: V2HouseholdShape): HouseholdV2CreateRequest {
  return {
    country_id: household.country_id,
    year: household.year,
    label: household.label ?? null,
    people: household.people,
    tax_unit: household.tax_unit ?? null,
    family: household.family ?? null,
    spm_unit: household.spm_unit ?? null,
    marital_unit: household.marital_unit ?? null,
    household: household.household ?? null,
    benunit: household.benunit ?? null,
  };
}

/**
 * Convert v2 alpha API response to app Household format
 */
export function v2ResponseToHousehold(response: HouseholdV2Response): V2HouseholdShape {
  return {
    id: response.id,
    country_id: response.country_id,
    year: response.year,
    label: response.label ?? undefined,
    people: response.people,
    tax_unit: response.tax_unit ?? undefined,
    family: response.family ?? undefined,
    spm_unit: response.spm_unit ?? undefined,
    marital_unit: response.marital_unit ?? undefined,
    household: response.household ?? undefined,
    benunit: response.benunit ?? undefined,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new household in v2 alpha API
 */
export async function createHouseholdV2(household: V2HouseholdShape): Promise<V2HouseholdShape> {
  const url = `${API_V2_BASE_URL}/households/`;
  const body = householdToV2Request(household);

  const json = await v2Fetch<HouseholdV2Response>(url, 'createHouseholdV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return v2ResponseToHousehold(json);
}

/**
 * Fetch a household by ID from v2 alpha API.
 * Throws with status code in message on any error (including 404).
 */
export async function fetchHouseholdByIdV2(householdId: string): Promise<V2HouseholdShape> {
  const url = `${API_V2_BASE_URL}/households/${householdId}`;

  const json = await v2Fetch<HouseholdV2Response>(url, `fetchHouseholdByIdV2(${householdId})`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return v2ResponseToHousehold(json);
}

/**
 * List households from v2 alpha API with optional filtering
 */
export async function listHouseholdsV2(options?: {
  country_id?: CountryId;
  limit?: number;
  offset?: number;
}): Promise<V2HouseholdShape[]> {
  const params = new URLSearchParams();

  if (options?.country_id) {
    params.set('country_id', options.country_id);
  }
  if (options?.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  const queryString = params.toString();
  const url = `${API_V2_BASE_URL}/households/${queryString ? `?${queryString}` : ''}`;

  const json = await v2Fetch<HouseholdV2Response[]>(url, 'listHouseholdsV2', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return json.map(v2ResponseToHousehold);
}

/**
 * Delete a household by ID from v2 alpha API.
 * Silently succeeds if the household is already deleted (404).
 */
export async function deleteHouseholdV2(householdId: string): Promise<void> {
  const url = `${API_V2_BASE_URL}/households/${householdId}`;

  await v2FetchVoid(url, `deleteHouseholdV2(${householdId})`, {
    method: 'DELETE',
    allowNotFound: true,
  });
}
