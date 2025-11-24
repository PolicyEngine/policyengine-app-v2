import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

/**
 * Determines the dataset to use for a society-wide calculation.
 * Returns 'enhanced_cps' for US nationwide calculations, undefined otherwise.
 * This ensures Enhanced CPS is only used for US nationwide impacts, not for UK or US state-level calculations.
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param region - The region (e.g., 'us', 'ca', 'uk')
 * @returns The dataset name or undefined to use API default
 */
export function getDatasetForRegion(countryId: string, region: string): string | undefined {
  // Only use enhanced_cps for US nationwide
  if (countryId === 'us' && region === 'us') {
    return 'enhanced_cps';
  }
  // Return undefined for all other cases (UK, US states, etc.)
  return undefined;
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

  // Automatically set dataset for US nationwide if not explicitly provided
  const dataset = params.dataset ?? getDatasetForRegion(countryId, params.region);
  const paramsWithDataset = dataset ? { ...params, dataset } : params;

  const queryParams = new URLSearchParams();

  Object.entries(paramsWithDataset).forEach(([key, value]) => {
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
