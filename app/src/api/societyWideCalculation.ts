import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

export interface PolicyEngineBundle {
  model_version?: string | null;
  policyengine_version?: string | null;
  data_version?: string | null;
  dataset?: string | null;
}

// NOTE: Need to add other params at later point
export interface SocietyWideCalculationParams {
  region: string; // Must include a region; "us" for US nationwide, two-letter state code for US states
  time_period: string; // Four-digit year
  dataset?: string; // Optional dataset parameter; defaults to API's default dataset
}

export interface SocietyWideCalculationResponse {
  status: 'computing' | 'ok' | 'error';
  queue_position?: number;
  average_time?: number;
  result: SocietyWideReportOutput | null;
  error?: string;
  policyengine_bundle?: PolicyEngineBundle | null;
}

function mergePolicyEngineBundle(
  response: SocietyWideCalculationResponse
): SocietyWideCalculationResponse {
  if (!response.result || !response.policyengine_bundle) {
    return response;
  }

  const { policyengine_bundle: bundle } = response;

  return {
    ...response,
    result: {
      ...response.result,
      model_version: bundle.model_version ?? response.result.model_version,
      policyengine_version:
        bundle.policyengine_version ?? response.result.policyengine_version ?? null,
      data_version: bundle.data_version ?? response.result.data_version,
      dataset: bundle.dataset ?? response.result.dataset ?? null,
    },
  };
}

export async function fetchSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<SocietyWideCalculationResponse> {
  // TEMPORARY: Simulate API 500 to test error handling
  throw new Error('Simulated 500: Society-wide calculation failed');

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // ignore
    }
    console.error(
      `[fetchSocietyWideCalculation] ${response.status} ${response.statusText}`,
      url,
      body
    );
    throw new Error(
      `Society-wide calculation failed (${response.status}): ${body || response.statusText}`
    );
  }

  const data: SocietyWideCalculationResponse = await response.json();
  return mergePolicyEngineBundle(data);
}
