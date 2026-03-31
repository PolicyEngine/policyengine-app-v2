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
import type { PolicyIdInput, ReportStatus, SimulationInfo } from './types';
import { cancellableSleep, v2Fetch } from './v2Fetch';

// ============================================================================
// Types
// ============================================================================

// Re-export shared types for backwards compatibility
export type { ReportStatus, SimulationInfo, PolicyIdInput };

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
  country_id: string;
  region?: string | null;
  dataset_id?: string | null;
  baseline_policy_id?: PolicyIdInput;
  reform_policy_id?: PolicyIdInput;
  dynamic_id?: string | null;
  year?: number | null;
  run?: boolean;
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
  country_id: string;
  region?: string | null;
  dataset_id?: string | null;
  baseline_policy_id?: PolicyIdInput;
  reform_policy_id?: PolicyIdInput;
  dynamic_id?: string | null;
  year?: number | null;
  modules: string[];
  run?: boolean;
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
    case 'pending':
    case 'execution_deferred':
    case 'running':
      return 'pending';
    default:
      console.warn(`[v2 API] Unknown economy report status: "${status}"`);
      return 'pending';
  }
}

/** Convert economic impact response to app Report (metadata only, output stored separately) */
export function fromEconomicImpactResponse(
  response: EconomicImpactResponse,
  countryId: Report['countryId'],
  year: string
): Report {
  return {
    id: response.report_id,
    countryId,
    year,
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
  return v2Fetch<EconomicImpactResponse>(
    `${API_V2_BASE_URL}/analysis/economic-impact`,
    'createEconomyAnalysis',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
}

/**
 * Get economy analysis status and results.
 * GET /analysis/economic-impact/{report_id}
 */
export async function getEconomyAnalysis(reportId: string): Promise<EconomicImpactResponse> {
  return v2Fetch<EconomicImpactResponse>(
    `${API_V2_BASE_URL}/analysis/economic-impact/${reportId}`,
    'getEconomyAnalysis',
    { headers: { Accept: 'application/json' } }
  );
}

/**
 * Poll economy analysis until completed or failed.
 */
export async function pollEconomyAnalysis(
  reportId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<EconomicImpactResponse> {
  const { pollIntervalMs = 2000, timeoutMs = 600000, signal } = options;
  const startTime = Date.now();
  const maxTransientRetries = 3;
  let transientFailures = 0;

  while (Date.now() - startTime < timeoutMs) {
    let response: EconomicImpactResponse;
    try {
      response = await getEconomyAnalysis(reportId);
      transientFailures = 0;
    } catch (err) {
      transientFailures++;
      if (transientFailures >= maxTransientRetries) {
        throw err;
      }
      console.warn(
        `[v2 API] pollEconomyAnalysis: transient error (${transientFailures}/${maxTransientRetries})`,
        err
      );
      await cancellableSleep(pollIntervalMs, signal);
      continue;
    }

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Economy analysis failed');
    }

    await cancellableSleep(pollIntervalMs, signal);
  }

  throw new Error(`Economy analysis timed out for report ${reportId}`);
}

/**
 * Create a custom economy analysis with selected modules.
 * POST /analysis/economy-custom
 */
export async function createEconomyCustomAnalysis(
  request: EconomyCustomRequest
): Promise<EconomicImpactResponse> {
  return v2Fetch<EconomicImpactResponse>(
    `${API_V2_BASE_URL}/analysis/economy-custom`,
    'createEconomyCustomAnalysis',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    }
  );
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
  return v2Fetch<EconomicImpactResponse>(
    `${API_V2_BASE_URL}/analysis/economy-custom/${reportId}?${params}`,
    'getEconomyCustomAnalysis',
    { headers: { Accept: 'application/json' } }
  );
}

/**
 * Force-rerun a report from scratch.
 * POST /analysis/rerun/{report_id}
 */
export async function rerunReport(
  reportId: string
): Promise<{ report_id: string; status: string }> {
  return v2Fetch<{ report_id: string; status: string }>(
    `${API_V2_BASE_URL}/analysis/rerun/${reportId}`,
    'rerunReport',
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
    }
  );
}
