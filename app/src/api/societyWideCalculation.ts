import { BASE_URL } from '@/constants';
import type {
  ExecutionProvenance,
  ExecutionReceipt,
  PolicyEngineBundle,
} from '@/types/calculation/ExecutionReceipt';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type SocietyWideReportOutput = (ReportOutputSocietyWideUS | ReportOutputSocietyWideUK) &
  ExecutionProvenance;

export type { PolicyEngineBundle } from '@/types/calculation/ExecutionReceipt';

// NOTE: Need to add other params at later point
export interface SocietyWideCalculationParams {
  region: string; // "us" for US nationwide, "state/ca" for US states, or another API v1 region code
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
  execution_receipt?: ExecutionReceipt | null;
}

function mergeExecutionProvenance(
  response: SocietyWideCalculationResponse
): SocietyWideCalculationResponse {
  if (!response.result) {
    return response;
  }

  const bundle = response.policyengine_bundle ?? response.result.policyengine_bundle ?? null;
  const executionReceipt = response.execution_receipt ?? response.result.execution_receipt ?? null;

  if (!bundle && !executionReceipt) {
    return response;
  }

  return {
    ...response,
    result: {
      ...response.result,
      policyengine_bundle: bundle,
      execution_receipt: executionReceipt,
      model_version: bundle?.model_version ?? response.result.model_version,
      policyengine_version:
        bundle?.policyengine_version ?? response.result.policyengine_version ?? null,
      data_version: bundle?.data_version ?? response.result.data_version,
      dataset: bundle?.dataset ?? response.result.dataset ?? null,
    },
  };
}

export async function fetchSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<SocietyWideCalculationResponse> {
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
  return mergeExecutionProvenance(data);
}
