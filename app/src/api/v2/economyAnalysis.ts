/**
 * Economy Analysis API - v2 Alpha
 *
 * Handles economy-wide baseline vs reform comparison analysis via the API v2 alpha.
 * The endpoint creates a report with baseline + reform simulations, computes all
 * impact metrics, and returns structured results.
 *
 * API Endpoints:
 * - POST /analysis/economic-impact              - Create economy analysis
 * - GET  /analysis/economic-impact/{report_id}   - Poll/retrieve results
 * - POST /analysis/economy-custom               - Create custom module analysis
 * - GET  /analysis/economy-custom/{report_id}    - Poll custom analysis results
 */

import { Report } from '@/types/ingredients/Report';
import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types
// ============================================================================

export type ReportStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SimulationInfo {
  id: string;
  status: string;
  error_message: string | null;
}

export interface AnalysisRegionInfo {
  code: string;
  label: string;
  region_type: string;
  requires_filter: boolean;
  filter_field: string | null;
  filter_value: string | null;
}

/** POST /analysis/economic-impact request body */
export interface EconomicImpactRequest {
  tax_benefit_model_name: string;
  region?: string | null;
  dataset_id?: string | null;
  policy_id?: string | null;
  dynamic_id?: string | null;
}

/** Response from POST and GET /analysis/economic-impact */
export interface EconomicImpactResponse {
  report_id: string;
  status: ReportStatus;
  baseline_simulation: SimulationInfo;
  reform_simulation: SimulationInfo;
  region: AnalysisRegionInfo | null;
  error_message: string | null;
  // Analysis results (populated when status === 'completed')
  decile_impacts: DecileImpactData[] | null;
  program_statistics: ProgramStatisticsData[] | null;
  poverty: PovertyData[] | null;
  inequality: InequalityData[] | null;
  budget_summary: BudgetSummaryData[] | null;
  intra_decile: IntraDecileData[] | null;
  detailed_budget: Record<string, Record<string, number | null>> | null;
  congressional_district_impact: CongressionalDistrictData[] | null;
  constituency_impact: ConstituencyData[] | null;
  local_authority_impact: LocalAuthorityData[] | null;
  wealth_decile: DecileImpactData[] | null;
  intra_wealth_decile: IntraDecileData[] | null;
}

/** POST /analysis/economy-custom request body */
export interface EconomyCustomRequest {
  tax_benefit_model_name: string;
  region?: string | null;
  dataset_id?: string | null;
  policy_id?: string | null;
  dynamic_id?: string | null;
  modules: string[];
}

// ---------------------------------------------------------------------------
// Nested data types (matching API *Read models)
// ---------------------------------------------------------------------------

export interface DecileImpactData {
  id: string;
  report_id: string;
  income_variable: string;
  entity: string | null;
  decile: number;
  quantiles: number;
  baseline_mean: number | null;
  reform_mean: number | null;
  absolute_change: number | null;
  relative_change: number | null;
  count_better_off: number | null;
  count_worse_off: number | null;
  count_no_change: number | null;
}

export interface ProgramStatisticsData {
  id: string;
  report_id: string;
  program_name: string;
  entity: string;
  is_tax: boolean;
  baseline_total: number | null;
  reform_total: number | null;
  change: number | null;
  baseline_count: number | null;
  reform_count: number | null;
  winners: number | null;
  losers: number | null;
}

/** Per-simulation poverty row. Baseline and reform are separate rows matched by simulation_id. */
export interface PovertyData {
  id: string;
  simulation_id: string;
  report_id: string;
  poverty_type: string;
  entity: string;
  filter_variable: string | null;
  headcount: number | null;
  total_population: number | null;
  rate: number | null;
}

/** Per-simulation inequality row. Baseline and reform are separate rows. */
export interface InequalityData {
  id: string;
  simulation_id: string;
  report_id: string;
  income_variable: string;
  entity: string;
  gini: number | null;
  top_10_share: number | null;
  top_1_share: number | null;
  bottom_50_share: number | null;
}

/** Per-variable budget row. Multiple rows per report (household_tax, household_benefits, etc.) */
export interface BudgetSummaryData {
  id: string;
  report_id: string;
  variable_name: string;
  entity: string;
  baseline_total: number | null;
  reform_total: number | null;
  change: number | null;
}

export interface IntraDecileData {
  id: string;
  report_id: string;
  decile: number;
  gain_more_than_5pct: number | null;
  gain_less_than_5pct: number | null;
  no_change: number | null;
  lose_less_than_5pct: number | null;
  lose_more_than_5pct: number | null;
}

export interface CongressionalDistrictData {
  id: string;
  report_id: string;
  district_geoid: number;
  state_fips: number;
  district_number: number;
  average_household_income_change: number | null;
  relative_household_income_change: number | null;
  population: number | null;
}

export interface ConstituencyData {
  id: string;
  report_id: string;
  constituency_code: string;
  constituency_name: string;
  x: number;
  y: number;
  average_household_income_change: number | null;
  relative_household_income_change: number | null;
  population: number | null;
}

export interface LocalAuthorityData {
  id: string;
  report_id: string;
  local_authority_code: string;
  local_authority_name: string;
  x: number;
  y: number;
  average_household_income_change: number | null;
  relative_household_income_change: number | null;
  population: number | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/** Map API report status to app domain status */
function toAppStatus(status: ReportStatus): Report['status'] {
  switch (status) {
    case 'completed':
      return 'complete';
    case 'failed':
      return 'error';
    default:
      return 'pending';
  }
}

/** Convert economic impact response to app Report (metadata only, output stored separately) */
export function fromEconomicImpactResponse(response: EconomicImpactResponse): Report {
  return {
    id: response.report_id,
    countryId: 'us', // Caller should override based on context
    year: new Date().getFullYear().toString(),
    apiVersion: 'v2',
    simulationIds: [response.baseline_simulation.id, response.reform_simulation.id],
    status: toAppStatus(response.status),
    outputType: 'economy',
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create an economy-wide analysis (baseline vs reform comparison).
 * POST /analysis/economic-impact
 */
export async function createEconomyAnalysis(
  request: EconomicImpactRequest
): Promise<EconomicImpactResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/analysis/economic-impact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create economy analysis: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Get economy analysis status and results.
 * GET /analysis/economic-impact/{report_id}
 */
export async function getEconomyAnalysis(reportId: string): Promise<EconomicImpactResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/analysis/economic-impact/${reportId}`, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    throw new Error(`Economy analysis report ${reportId} not found`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get economy analysis: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Poll economy analysis until completed or failed.
 */
export async function pollEconomyAnalysis(
  reportId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<EconomicImpactResponse> {
  const { pollIntervalMs = 2000, timeoutMs = 600000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await getEconomyAnalysis(reportId);

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Economy analysis failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Economy analysis timed out');
}

/**
 * Create a custom economy analysis with selected modules.
 * POST /analysis/economy-custom
 */
export async function createEconomyCustomAnalysis(
  request: EconomyCustomRequest
): Promise<EconomicImpactResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/analysis/economy-custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create custom economy analysis: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Get custom economy analysis results (filtered to requested modules).
 * GET /analysis/economy-custom/{report_id}?modules=mod1,mod2
 */
export async function getEconomyCustomAnalysis(
  reportId: string,
  modules: string[]
): Promise<EconomicImpactResponse> {
  const params = new URLSearchParams({ modules: modules.join(',') });
  const res = await fetch(`${API_V2_BASE_URL}/analysis/economy-custom/${reportId}?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    throw new Error(`Custom economy analysis report ${reportId} not found`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get custom economy analysis: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Force-rerun a report from scratch.
 * POST /analysis/rerun/{report_id}
 */
export async function rerunReport(
  reportId: string
): Promise<{ report_id: string; status: string }> {
  const res = await fetch(`${API_V2_BASE_URL}/analysis/rerun/${reportId}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to rerun report: ${res.status} ${errorText}`);
  }

  return res.json();
}
