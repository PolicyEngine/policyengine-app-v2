/**
 * Household API - CRUD operations for household data
 *
 * Internally uses v2 Alpha format (array-based with flat values).
 * Communicates with API v1 endpoints using conversion at the boundary.
 */

import { HouseholdAdapter, modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { BASE_URL } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCalculatePayload } from '@/types/payloads';
import { householdToV1CreationPayload, v1ResponseToHousehold } from './legacyConversion';

/**
 * Fetch a household by ID
 * Returns household in v2 format, converting from v1 API response
 */
export async function fetchHouseholdById(
  countryId: string,
  householdId: string
): Promise<Household> {
  const url = `${BASE_URL}/${countryId}/household/${householdId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch household ${householdId}`);
  }

  const json = await res.json();
  const result = json.result;

  // v1 API returns { id, country_id, household_json, ... }
  // Convert to v2 format
  const household = v1ResponseToHousehold(result.household_json, countryId as 'us' | 'uk');
  household.id = String(result.id);
  household.label = result.label ?? undefined;
  return household;
}

/**
 * Fetch household metadata by ID
 */
export async function fetchHouseholdMetadataById(
  countryId: string,
  householdId: string
): Promise<HouseholdMetadata> {
  const household = await fetchHouseholdById(countryId, householdId);
  return HouseholdAdapter.toMetadata(household, householdId);
}

/**
 * Create a new household in the API
 * Accepts v2 format, converts to v1 for the current API
 */
export async function createHousehold(household: Household): Promise<{ householdId: string }> {
  const countryId = modelNameToCountryId(household.tax_benefit_model_name);
  const url = `${BASE_URL}/${countryId}/household`;

  const legacyPayload = householdToV1CreationPayload(household);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(legacyPayload),
  });

  if (!res.ok) {
    throw new Error('Failed to create household');
  }

  const json = await res.json();
  return { householdId: String(json.result.household_id) };
}

/**
 * Create a household using payload format
 */
export async function createHouseholdFromPayload(
  payload: HouseholdCalculatePayload
): Promise<{ householdId: string }> {
  const household: Household = {
    tax_benefit_model_name: payload.tax_benefit_model_name,
    year: payload.year,
    people: payload.people,
    tax_unit: payload.tax_unit,
    family: payload.family,
    spm_unit: payload.spm_unit,
    marital_unit: payload.marital_unit,
    household: payload.household,
    benunit: payload.benunit,
  };

  return createHousehold(household);
}
