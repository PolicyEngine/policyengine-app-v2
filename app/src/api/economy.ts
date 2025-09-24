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
  status: 'pending' | 'complete' | 'error';
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
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Economy calculation failed: ${response.statusText}`);
  }

  return response.json();
}
