import type { PolicyEngineBundle } from '@/api/societyWideCalculation';
import { BASE_URL } from '@/constants';
import type { HouseholdCalculationData } from '@/types/calculation/household';
import type { SPMProvenance, SPMSelection } from '@/types/spm';
import { householdAPIError, householdAPIErrorFromBody } from './householdError';

export interface HouseholdCalculationResponse {
  status: 'ok' | 'error';
  result: HouseholdCalculationData | null;
  error?: string;
  policyengine_bundle?: PolicyEngineBundle | null;
  spm_config?: SPMSelection;
  spm_provenance?: SPMProvenance;
}

export interface HouseholdCalculationResult {
  result: HouseholdCalculationData;
  policyengine_bundle?: PolicyEngineBundle | null;
  spm_config?: SPMSelection;
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

    const data: HouseholdCalculationResponse = await response.json();

    if (data.status === 'error' || !data.result) {
      throw householdAPIErrorFromBody(data, 'Household calculation failed');
    }

    return {
      result: data.result,
      policyengine_bundle: data.policyengine_bundle ?? null,
      ...(data.spm_config ? { spm_config: data.spm_config } : {}),
      ...(data.spm_provenance ? { spm_provenance: data.spm_provenance } : {}),
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
