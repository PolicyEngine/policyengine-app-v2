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
  decile: number;
  relative_change: number | null;
  average_change: number | null;
  count_better_off: number | null;
  count_worse_off: number | null;
  count_no_change: number | null;
}

export interface ProgramStatisticsData {
  id: string;
  report_id: string;
  program_name: string;
  baseline_total: number | null;
  reform_total: number | null;
  change: number | null;
}

export interface PovertyData {
  id: string;
  report_id: string;
  category: string;
  filter_variable: string | null;
  filter_value: string | null;
  baseline_headcount: number | null;
  baseline_rate: number | null;
  reform_headcount: number | null;
  reform_rate: number | null;
  baseline_deep_headcount: number | null;
  baseline_deep_rate: number | null;
  reform_deep_headcount: number | null;
  reform_deep_rate: number | null;
}

export interface InequalityData {
  id: string;
  report_id: string;
  baseline_gini: number | null;
  reform_gini: number | null;
  baseline_top_10_share: number | null;
  reform_top_10_share: number | null;
  baseline_top_1_share: number | null;
  reform_top_1_share: number | null;
}

export interface BudgetSummaryData {
  id: string;
  report_id: string;
  tax_revenue_impact: number | null;
  benefit_spending_impact: number | null;
  net_budget_impact: number | null;
  state_tax_revenue_impact: number | null;
  household_count: number | null;
  baseline_net_income: number | null;
}

export interface IntraDecileData {
  id: string;
  report_id: string;
  decile: number;
  gain_more_than_5_pct: number | null;
  gain_less_than_5_pct: number | null;
  no_change: number | null;
  lose_less_than_5_pct: number | null;
  lose_more_than_5_pct: number | null;
}

export interface CongressionalDistrictData {
  id: string;
  report_id: string;
  district: string;
  state: string;
  average_change: number | null;
  relative_change: number | null;
}

export interface ConstituencyData {
  id: string;
  report_id: string;
  constituency: string;
  average_change: number | null;
  relative_change: number | null;
}

export interface LocalAuthorityData {
  id: string;
  report_id: string;
  local_authority: string;
  average_change: number | null;
  relative_change: number | null;
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
