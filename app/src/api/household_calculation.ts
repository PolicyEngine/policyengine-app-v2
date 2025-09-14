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
  const url = `${BASE_URL}/${countryId}/household/${householdId}/policy/${policyId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Household calculation failed: ${response.statusText}`);
    }

    const data: HouseholdCalculationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw new Error(data.error || 'Household calculation failed');
    }

    return data.result;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Household calculation timed out after 50 seconds (client-side timeout)');
    }

    throw error;
  }
}