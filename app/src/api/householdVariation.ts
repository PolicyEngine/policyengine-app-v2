/**
 * Household Variation API - Earnings variation calculations
 *
 * Internally uses v2 Alpha format. Communicates with API v1 endpoints.
 */

import { modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { BASE_URL } from '@/constants';
import { HouseholdWithAxes } from '@/utils/householdVariationAxes';
import { householdToV1Request } from './legacyConversion';

export interface HouseholdVariationResponse {
  status: 'ok' | 'error';
  result: any;
  error?: string;
}

/**
 * Fetch household variation data across earnings range
 * Uses calculate-full endpoint with axes parameter
 */
export async function fetchHouseholdVariation(
  countryId: string,
  householdWithAxes: HouseholdWithAxes,
  policyData: any
): Promise<any> {
  const requestUrl = `${BASE_URL}/${countryId}/calculate-full`;

  // Convert v2 household to v1 format and attach axes
  const v1Household = householdToV1Request(householdWithAxes);
  v1Household.axes = householdWithAxes.axes;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        household: v1Household,
        policy: policyData,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.message || errorJson.error || errorText;
      } catch {
        // Not JSON
      }

      throw new Error(
        `Variation calculation failed: ${response.status} ${response.statusText}. ${errorDetail}`
      );
    }

    const data: HouseholdVariationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw new Error(data.error || 'Household variation calculation failed');
    }

    return data.result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Household variation calculation timed out after 10 minutes');
    }

    throw error;
  }
}

/**
 * Convenience wrapper that extracts countryId from household
 */
export async function fetchHouseholdVariationV2(
  householdWithAxes: HouseholdWithAxes,
  policyData: any
): Promise<any> {
  const countryId = modelNameToCountryId(householdWithAxes.tax_benefit_model_name);
  return fetchHouseholdVariation(countryId, householdWithAxes, policyData);
}
