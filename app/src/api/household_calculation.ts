import { BASE_URL } from '@/constants';
import { Household } from '@/types/ingredients/Household';

export interface HouseholdCalculationResponse {
  status: 'ok' | 'error';
  result: Household | null;
  error?: string;
}

export async function fetchHouseholdCalculation(
  countryId: string,
  householdId: string,
  policyId: string
): Promise<Household> {
  console.log('[fetchHouseholdCalculation] Called with:');
  console.log('  - countryId:', countryId);
  console.log('  - householdId:', householdId);
  console.log('  - policyId:', policyId);

  const url = `${BASE_URL}/${countryId}/household/${householdId}/policy/${policyId}`;
  console.log('[fetchHouseholdCalculation] Fetching URL:', url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000); // 4-minute timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[fetchHouseholdCalculation] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[fetchHouseholdCalculation] Failed with status:', response.status, response.statusText);
      throw new Error(`Household calculation failed: ${response.statusText}`);
    }

    const data: HouseholdCalculationResponse = await response.json();
    console.log('[fetchHouseholdCalculation] Response data:');
    console.log('  - status:', data.status);
    console.log('  - has result?', !!data.result);
    console.log('  - error:', data.error);

    if (data.status === 'error' || !data.result) {
      console.error('[fetchHouseholdCalculation] Calculation error:', data.error);
      throw new Error(data.error || 'Household calculation failed');
    }

    console.log('[fetchHouseholdCalculation] Returning successful result');
    return data.result;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[fetchHouseholdCalculation] Request timed out');
      throw new Error('Household calculation timed out after 50 seconds (client-side timeout)');
    }

    console.error('[fetchHouseholdCalculation] Error occurred:', error);
    throw error;
  }
}
