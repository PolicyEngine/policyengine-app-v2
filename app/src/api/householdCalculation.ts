import type { PolicyEngineBundle } from '@/api/societyWideCalculation';
import { BASE_URL } from '@/constants';
import type { HouseholdCalculationData } from '@/types/calculation/household';
import { parseOptionalSPMCalculationProvenance, type SPMProvenance } from '@/types/spm';
import { householdAPIError, householdAPIErrorFromBody } from './householdError';

export interface HouseholdCalculationResponse {
  status: 'ok' | 'error';
  result: HouseholdCalculationData | null;
  error?: string;
  policyengine_bundle?: PolicyEngineBundle | null;
  spm_provenance?: SPMProvenance;
}

export interface HouseholdCalculationResult {
  result: HouseholdCalculationData;
  policyengine_bundle?: PolicyEngineBundle | null;
  spm_provenance?: SPMProvenance;
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
      throw await householdAPIError(
        response,
        `Household calculation failed: ${response.statusText}`
      );
    }

    const rawData: unknown = await response.json();
    const data = rawData as HouseholdCalculationResponse;

    if (data.status === 'error' || !data.result) {
      throw householdAPIErrorFromBody(rawData, 'Household calculation failed');
    }

    const spm = parseOptionalSPMCalculationProvenance(rawData);

    return {
      result: data.result,
      policyengine_bundle: data.policyengine_bundle ?? null,
      ...(spm ?? {}),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Household calculation timed out after 50 seconds (client-side timeout)');
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
