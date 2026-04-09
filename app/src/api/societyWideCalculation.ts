import { BASE_URL } from '@/constants';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';
import type { BudgetWindowReportOutput } from '@/types/report/BudgetWindowReportOutput';

export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

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

export interface BudgetWindowCalculationParams {
  region: string;
  start_year: string;
  window_size: number;
  dataset?: string;
}

export interface BudgetWindowCalculationResponse {
  status: 'computing' | 'ok' | 'error';
  result: BudgetWindowReportOutput | null;
  progress?: number;
  completed_years?: string[];
  computing_years?: string[];
  queued_years?: string[];
  message?: string | null;
  error?: string;
}

function buildQueryString<T extends object>(params: T): string {
  const queryParams = new URLSearchParams();

  Object.entries(params as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  return queryParams.toString();
}

async function fetchCalculationResponse<T>(url: string, logPrefix: string): Promise<T> {
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
    console.error(`${logPrefix} ${response.status} ${response.statusText}`, url, body);
    throw new Error(
      `Society-wide calculation failed (${response.status}): ${body || response.statusText}`
    );
  }

  return response.json();
}

export async function fetchSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<SocietyWideCalculationResponse> {
  const queryString = buildQueryString(params);
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;

  return fetchCalculationResponse<SocietyWideCalculationResponse>(
    url,
    '[fetchSocietyWideCalculation]'
  );
}

export async function fetchBudgetWindowSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: BudgetWindowCalculationParams
): Promise<BudgetWindowCalculationResponse> {
  const queryString = buildQueryString(params);
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}/budget-window${queryString ? `?${queryString}` : ''}`;

  return fetchCalculationResponse<BudgetWindowCalculationResponse>(
    url,
    '[fetchBudgetWindowSocietyWideCalculation]'
  );
}
