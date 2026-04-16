/**
 * Households API - v2 Alpha CRUD operations
 *
 * This module handles all communication with the API v2 Alpha /households endpoints.
 * These endpoints manage stored household definitions (CRUD), not calculations.
 *
 * For running calculations on a household, use householdCalculation.ts instead.
 */

import type { CountryId } from '@/libs/countries';
import type {
  V2CreateHouseholdEnvelope,
  V2StoredHouseholdEnvelope,
} from '@/models/household/v2Types';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch, v2FetchVoid } from './v2Fetch';

/**
 * Create a new household in v2 alpha API
 */
export async function createHouseholdV2(
  household: V2CreateHouseholdEnvelope
): Promise<V2StoredHouseholdEnvelope> {
  const url = `${API_V2_BASE_URL}/households/`;

  return v2Fetch<V2StoredHouseholdEnvelope>(url, 'createHouseholdV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(household),
  });
}

/**
 * Fetch a household by ID from v2 alpha API.
 * Throws with status code in message on any error (including 404).
 */
export async function fetchHouseholdByIdV2(
  householdId: string
): Promise<V2StoredHouseholdEnvelope> {
  const url = `${API_V2_BASE_URL}/households/${householdId}`;

  return v2Fetch<V2StoredHouseholdEnvelope>(url, `fetchHouseholdByIdV2(${householdId})`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
}

/**
 * List households from v2 alpha API with optional filtering
 */
export async function listHouseholdsV2(options?: {
  country_id?: CountryId;
  limit?: number;
  offset?: number;
}): Promise<V2StoredHouseholdEnvelope[]> {
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

  return v2Fetch<V2StoredHouseholdEnvelope[]>(url, 'listHouseholdsV2', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
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
