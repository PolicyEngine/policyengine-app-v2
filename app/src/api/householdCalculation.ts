import { BASE_URL } from '@/constants';
import type {
  ExecutionProvenance,
  ExecutionReceipt,
  PolicyEngineBundle,
} from '@/types/calculation/ExecutionReceipt';
import type { HouseholdCalculationData } from '@/types/calculation/household';

export interface HouseholdCalculationResponse {
  status: 'ok' | 'error';
  result: HouseholdCalculationData | null;
  error?: string;
  policyengine_bundle?: PolicyEngineBundle | null;
  execution_receipt?: ExecutionReceipt | null;
}

export interface HouseholdCalculationResult extends ExecutionProvenance {
  result: HouseholdCalculationData;
}

export async function fetchHouseholdCalculationWithBundle(
  countryId: string,
  householdId: string,
  policyId: string
): Promise<HouseholdCalculationResult> {
  const url = `${BASE_URL}/${countryId}/household/${householdId}/policy/${policyId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240000); // 4-minute timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Household calculation failed: ${response.statusText}`);
    }

    const data: HouseholdCalculationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw new Error(data.error || 'Household calculation failed');
    }

    return {
      result: data.result,
      policyengine_bundle: data.policyengine_bundle ?? null,
      execution_receipt: data.execution_receipt ?? null,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Household calculation timed out after 4 minutes (client-side timeout)');
    }

    throw error;
  }
}

export async function fetchHouseholdCalculation(
  countryId: string,
  householdId: string,
  policyId: string
): Promise<HouseholdCalculationData> {
  const data = await fetchHouseholdCalculationWithBundle(countryId, householdId, policyId);
  return data.result;
}
