/**
 * Household Calculation API - Run simulations on household data
 *
 * Internally uses v2 Alpha format (array-based with flat values).
 * Communicates with API v1 endpoints using conversion at the boundary.
 */

import { modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { BASE_URL } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import { householdToV1Request, v1ResponseToHousehold } from './legacyConversion';

export interface HouseholdCalculationResponse {
  status: 'ok' | 'error';
  result: Record<string, any> | null;
  error?: string;
}

/**
 * Fetch household calculation results by stored IDs
 */
export async function fetchHouseholdCalculation(
  countryId: string,
  householdId: string,
  policyId: string
): Promise<Household> {
  const url = `${BASE_URL}/${countryId}/household/${householdId}/policy/${policyId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Household calculation failed: ${response.statusText}`);
    }

    const data: HouseholdCalculationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw new Error(data.error || 'Household calculation failed');
    }

    return v1ResponseToHousehold(data.result, countryId as 'us' | 'uk');
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Household calculation timed out after 4 minutes');
    }

    throw error;
  }
}

/**
 * Calculate household with inline data (not stored)
 * Uses calculate-full endpoint
 */
export async function calculateHousehold(
  countryId: string,
  household: Household,
  policyData?: Record<string, any> | null
): Promise<Household> {
  const url = `${BASE_URL}/${countryId}/calculate-full`;

  const v1Household = householdToV1Request(household);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        household: v1Household,
        policy: policyData ?? {},
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Calculation failed: ${response.statusText}`);
    }

    const data: HouseholdCalculationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw new Error(data.error || 'Calculation failed');
    }

    return v1ResponseToHousehold(data.result, countryId as 'us' | 'uk');
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Calculation timed out after 4 minutes');
    }

    throw error;
  }
}

/**
 * Convenience wrapper that extracts countryId from household
 */
export async function calculateHouseholdV2(
  household: Household,
  policyData?: Record<string, any> | null
): Promise<Household> {
  const countryId = modelNameToCountryId(household.tax_benefit_model_name);
  return calculateHousehold(countryId, household, policyData);
}
