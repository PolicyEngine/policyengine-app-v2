/**
 * Households API - v2 Alpha CRUD operations
 *
 * This module handles all communication with the API v2 Alpha /households endpoints.
 * These endpoints manage stored household definitions (CRUD), not calculations.
 *
 * For running calculations on a household, use householdCalculation.ts instead.
 */

import { Household, TaxBenefitModelName } from '@/types/ingredients/Household';
import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types for v2 Alpha /households API
// ============================================================================

/**
 * Response from v2 alpha household endpoints (HouseholdRead schema)
 */
export interface HouseholdV2Response {
  id: string; // UUID
  tax_benefit_model_name: TaxBenefitModelName;
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
  tax_benefit_model_name: TaxBenefitModelName;
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
export function householdToV2Request(household: Household): HouseholdV2CreateRequest {
  return {
    tax_benefit_model_name: household.tax_benefit_model_name,
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
export function v2ResponseToHousehold(response: HouseholdV2Response): Household {
  return {
    id: response.id,
    tax_benefit_model_name: response.tax_benefit_model_name,
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
export async function createHouseholdV2(household: Household): Promise<Household> {
  const url = `${API_V2_BASE_URL}/households/`;
  const body = householdToV2Request(household);

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
    throw new Error(`Failed to create household: ${res.status} ${errorText}`);
  }

  const json: HouseholdV2Response = await res.json();
  return v2ResponseToHousehold(json);
}

/**
 * Fetch a household by ID from v2 alpha API
 */
export async function fetchHouseholdByIdV2(householdId: string): Promise<Household> {
  const url = `${API_V2_BASE_URL}/households/${householdId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Household ${householdId} not found`);
    }
    const errorText = await res.text();
    throw new Error(`Failed to fetch household ${householdId}: ${res.status} ${errorText}`);
  }

  const json: HouseholdV2Response = await res.json();
  return v2ResponseToHousehold(json);
}

/**
 * List households from v2 alpha API with optional filtering
 */
export async function listHouseholdsV2(options?: {
  tax_benefit_model_name?: TaxBenefitModelName;
  limit?: number;
  offset?: number;
}): Promise<Household[]> {
  const params = new URLSearchParams();

  if (options?.tax_benefit_model_name) {
    params.set('tax_benefit_model_name', options.tax_benefit_model_name);
  }
  if (options?.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options?.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  const queryString = params.toString();
  const url = `${API_V2_BASE_URL}/households/${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list households: ${res.status} ${errorText}`);
  }

  const json: HouseholdV2Response[] = await res.json();
  return json.map(v2ResponseToHousehold);
}

/**
 * Delete a household by ID from v2 alpha API
 */
export async function deleteHouseholdV2(householdId: string): Promise<void> {
  const url = `${API_V2_BASE_URL}/households/${householdId}`;

  const res = await fetch(url, {
    method: 'DELETE',
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Household ${householdId} not found`);
    }
    const errorText = await res.text();
    throw new Error(`Failed to delete household ${householdId}: ${res.status} ${errorText}`);
  }
}
