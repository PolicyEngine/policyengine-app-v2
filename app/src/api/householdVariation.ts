import { BASE_URL } from '@/constants';

export interface HouseholdVariationResponse {
  status: 'ok' | 'error';
  result: any;
  error?: string;
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
export async function fetchHouseholdVariation(
  countryId: string,
  householdWithAxes: any,
  policyData: any
): Promise<any> {
  const requestUrl = `${BASE_URL}/${countryId}/calculate-full`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000); // 4-minute timeout

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        household: householdWithAxes,
        policy: policyData,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();

      // Try to parse error response if it's JSON
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.message || errorJson.error || errorText;
      } catch {
        // Not JSON, use text as-is
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

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Household variation calculation timed out after 4 minutes (client-side timeout)'
      );
    }

    throw error;
  }
}
