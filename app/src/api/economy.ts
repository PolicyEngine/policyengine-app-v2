import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type EconomyReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

// NOTE: Need to add other params at later point
export interface EconomyCalculationParams {
  region: string; // Must include a region; "us" for US nationwide, two-letter state code for US states
  time_period: string; // Four-digit year
}

export interface EconomyCalculationResponse {
  status: 'computing' | 'complete' | 'error';
  queue_position?: number;
  average_time?: number;
  result: EconomyReportOutput | null;
  error?: string;
}

export async function fetchEconomyCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: EconomyCalculationParams
): Promise<EconomyCalculationResponse> {
  console.log('[fetchEconomyCalculation] Called with:');
  console.log('  - countryId:', countryId);
  console.log('  - reformPolicyId:', reformPolicyId);
  console.log('  - baselinePolicyId:', baselinePolicyId);
  console.log('  - params:', JSON.stringify(params, null, 2));

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;
  console.log('[fetchEconomyCalculation] Fetching URL:', url);

  const response = await fetch(url);
  console.log('[fetchEconomyCalculation] Response status:', response.status, response.statusText);

  if (!response.ok) {
    console.error('[fetchEconomyCalculation] Failed with status:', response.status, response.statusText);
    throw new Error(`Economy calculation failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[fetchEconomyCalculation] Response data:');
  console.log('  - status:', data.status);
  console.log('  - has result?', !!data.result);
  console.log('  - queue_position:', data.queue_position);
  console.log('  - average_time:', data.average_time);
  console.log('  - error:', data.error);
  console.log('  - full response:', JSON.stringify(data, null, 2));

  return data;
}
