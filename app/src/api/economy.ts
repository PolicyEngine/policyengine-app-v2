import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUS } from '@/types/metadata/reportOutputMetadata/ReportOutputSocietyWideUS';
import { ReportOutputSocietyWideUK } from '@/types/metadata/reportOutputMetadata/ReportOutputSocietyWideUK';

export type EconomyReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

// NOTE: Need to add other params at later point
export interface EconomyCalculationParams {
  region?: string;
}

export interface EconomyCalculationResponse {
  status: 'pending' | 'completed' | 'error';
  queue_position?: number;
  average_time?: number;
  result: EconomyReportOutput | null;
  error?: string;
}

export async function fetchEconomyCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params?: EconomyCalculationParams
): Promise<EconomyCalculationResponse> {
  const queryParams = new URLSearchParams();

  if (params?.region !== undefined) {
    queryParams.append('region', params.region);
  }

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Economy calculation failed: ${response.statusText}`);
  }

  return response.json();
}