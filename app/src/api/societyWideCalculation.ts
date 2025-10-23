import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

// NOTE: Need to add other params at later point
export interface SocietyWideCalculationParams {
  region: string; // Must include a region; "us" for US nationwide, two-letter state code for US states
  time_period: string; // Four-digit year
}

export interface SocietyWideCalculationResponse {
  status: 'computing' | 'ok' | 'error';
  queue_position?: number;
  average_time?: number;
  result: SocietyWideReportOutput | null;
  error?: string;
}

export async function fetchSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<SocietyWideCalculationResponse> {
  console.log('[fetchSocietyWideCalculation] Called with:');
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
  console.log('[fetchSocietyWideCalculation] Fetching URL:', url);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log(
    '[fetchSocietyWideCalculation] Response status:',
    response.status,
    response.statusText
  );

  if (!response.ok) {
    console.error(
      '[fetchSocietyWideCalculation] Failed with status:',
      response.status,
      response.statusText
    );
    throw new Error(`Society-wide calculation failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('[fetchSocietyWideCalculation] Response data:');
  console.log('  - status:', data.status);
  console.log('  - has result?', !!data.result);
  console.log('  - queue_position:', data.queue_position);
  console.log('  - average_time:', data.average_time);
  console.log('  - error:', data.error);
  console.log('  - full response:', JSON.stringify(data, null, 2));

  return data;
}
