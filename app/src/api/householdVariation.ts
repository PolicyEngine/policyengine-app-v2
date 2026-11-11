import { BASE_URL } from '@/constants';
import type { HouseholdCalculationData } from '@/types/calculation/household';
import type { SPMProvenance, SPMSelection } from '@/types/spm';
import { householdAPIError, householdAPIErrorFromBody } from './householdError';

export interface HouseholdVariationResponse {
  status: 'ok' | 'error';
  result: HouseholdCalculationData | null;
  error?: string;
  spm_config?: SPMSelection;
  spm_provenance?: SPMProvenance;
}

/**
 * Fetches household variation data across earnings range
 * Uses calculate-full endpoint with axes parameter to get 401-point arrays for all variables
 *
 * @param countryId - Country code (e.g., 'us', 'uk')
 * @param householdWithAxes - Household data with axes configuration
 * @param policyData - Policy parameters to apply
 * @returns Household data with array values (401 points) for all variables
 */
export async function fetchHouseholdVariationWithProvenance(
  countryId: string,
  householdWithAxes: any,
  policyData: any,
  spm?: SPMSelection
): Promise<HouseholdVariationResponse & { result: HouseholdCalculationData }> {
  const requestUrl = `${BASE_URL}/${countryId}/calculate-full`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 10-minute timeout

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        household: householdWithAxes,
        policy: policyData,
        ...(spm ? { spm } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw await householdAPIError(
        response,
        `Variation calculation failed: ${response.status} ${response.statusText}`
      );
    }

    const data: HouseholdVariationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw householdAPIErrorFromBody(data, 'Household variation calculation failed');
    }

    return { ...data, result: data.result };
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Household variation calculation timed out after 10 minutes (client-side timeout)'
      );
    }

    throw error;
  }
}

export async function fetchHouseholdVariation(
  countryId: string,
  householdWithAxes: any,
  policyData: any,
  spm?: SPMSelection
): Promise<HouseholdCalculationData> {
  const response = await fetchHouseholdVariationWithProvenance(
    countryId,
    householdWithAxes,
    policyData,
    spm
  );
  return response.result;
}
