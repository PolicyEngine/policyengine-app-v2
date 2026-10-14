import { BASE_URL } from '@/constants';

/** One year of a budget window, as the simulation API scores it. */
export interface BudgetWindowYear {
  /** "2026", or "Total" on the totals row */
  year: string | number;
  taxRevenueImpact: number;
  federalTaxRevenueImpact: number;
  stateTaxRevenueImpact: number;
  benefitSpendingImpact: number;
  /** Revenue change less spending change: negative is a cost to the government. */
  budgetaryImpact: number;
}

export interface BudgetWindowResult {
  kind: 'budgetWindow';
  startYear: string | number;
  endYear: string | number;
  windowSize: number;
  annualImpacts: BudgetWindowYear[];
  totals: BudgetWindowYear;
}

export interface BudgetWindowResponse {
  status: 'computing' | 'ok' | 'error';
  /** e.g. "Scoring 2026, 2027 (0 of 10 complete)..." */
  message?: string | null;
  result: BudgetWindowResult | null;
  /** 0–100: the share of years scored */
  progress?: number | null;
  completed_years?: string[] | null;
  computing_years?: string[] | null;
  queued_years?: string[] | null;
  error?: string | null;
}

export interface BudgetWindowParams {
  /** "us", "state/ca", "congressional_district/CA-12", "uk" */
  region: string;
  startYear: number;
  /** Years in the window, 1–75 */
  windowSize: number;
}

/** The API scores a window of up to 75 years, ending no later than 2099. */
export const MAX_WINDOW_SIZE = 75;
export const LAST_WINDOW_YEAR = 2099;

/**
 * Starts, or checks on, a budget-window run: one reform scored against
 * its baseline for each year of the window. The API runs the years in
 * parallel and caches the result, so the same call both submits the run
 * and polls it — repeat it while the status is "computing". Only the
 * budget is scored per year; the distribution and poverty outputs are
 * the single-year report's.
 */
export async function fetchBudgetWindow(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  { region, startYear, windowSize }: BudgetWindowParams
): Promise<BudgetWindowResponse> {
  const query = new URLSearchParams({
    region,
    start_year: String(startYear),
    window_size: String(windowSize),
  });
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}/budget-window?${query}`;
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    // 400 is a request the API refused, e.g. a window past 2099.
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message ?? body?.error ?? '';
    } catch {
      // No body to read.
    }
    throw new Error(detail || `Budget window request failed (${response.status})`);
  }
  return response.json();
}
