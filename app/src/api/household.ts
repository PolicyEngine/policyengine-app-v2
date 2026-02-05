/**
 * Household API - CRUD operations for household data
 *
 * This module provides the public API for household CRUD operations.
 * Internally uses API v2 Alpha endpoints directly.
 */

import { HouseholdAdapter } from '@/adapters/HouseholdAdapter';
import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCalculatePayload } from '@/types/payloads';
import {
  createHouseholdV2,
  deleteHouseholdV2,
  fetchHouseholdByIdV2,
  listHouseholdsV2,
} from './v2/households';

/**
 * Fetch a household by ID
 * Returns household in v2 format from API v2 Alpha
 *
 * Note: countryId parameter is kept for backward compatibility but is no longer
 * needed since v2 alpha stores households with their model name.
 */
export async function fetchHouseholdById(
  _countryId: string,
  householdId: string
): Promise<Household> {
  return fetchHouseholdByIdV2(householdId);
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
 * Accepts Household format, creates via v2 alpha API
 */
export async function createHousehold(household: Household): Promise<{ householdId: string }> {
  const created = await createHouseholdV2(household);
  return { householdId: created.id! };
}

/**
 * Create a household using payload format
 * Converts HouseholdCalculatePayload to Household and creates via v2 alpha
 *
 * Note: HouseholdCalculatePayload uses arrays for entity groups, but the storage
 * API uses single dicts. We extract the first element from each array.
 */
export async function createHouseholdFromPayload(
  payload: HouseholdCalculatePayload
): Promise<{ householdId: string }> {
  // Convert from calculation format (arrays) to storage format (single dicts)
  const household: Household = {
    tax_benefit_model_name: payload.tax_benefit_model_name,
    year: payload.year,
    people: payload.people,
    tax_unit: payload.tax_unit?.[0],
    family: payload.family?.[0],
    spm_unit: payload.spm_unit?.[0],
    marital_unit: payload.marital_unit?.[0],
    household: payload.household?.[0],
    benunit: payload.benunit?.[0],
  };

  return createHousehold(household);
}

/**
 * List households with optional filtering
 */
export async function listHouseholds(options?: {
  countryId?: string;
  limit?: number;
  offset?: number;
}): Promise<Household[]> {
  // Convert countryId to model name for v2 alpha API
  let tax_benefit_model_name: 'policyengine_us' | 'policyengine_uk' | undefined;
  if (options?.countryId === 'us') {
    tax_benefit_model_name = 'policyengine_us';
  } else if (options?.countryId === 'uk') {
    tax_benefit_model_name = 'policyengine_uk';
  }

  return listHouseholdsV2({
    tax_benefit_model_name,
    limit: options?.limit,
    offset: options?.offset,
  });
}

/**
 * Delete a household by ID
 */
export async function deleteHousehold(householdId: string): Promise<void> {
  return deleteHouseholdV2(householdId);
}
