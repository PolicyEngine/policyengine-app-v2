/**
 * Report Full API - v2 Alpha
 *
 * Fetches complete report data in a single API call, including:
 * - Report metadata
 * - Simulation info
 * - Policies with parameter values
 * - Household or region data
 * - Economic or household impact results
 *
 * API Endpoint:
 * - GET /reports/{report_id}/full - Read-only composite endpoint
 */

import { V2PolicyResponse } from '@/api/policy';
import {
  AnalysisRegionInfo,
  EconomicImpactResponse,
  SimulationInfo,
} from '@/api/v2/economyAnalysis';
import { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types
// ============================================================================

export interface ReportReadResponse {
  id: string;
  label: string;
  description: string | null;
  report_type: string | null;
  status: string;
  error_message: string | null;
  baseline_simulation_id: string | null;
  reform_simulation_id: string | null;
  created_at: string;
}

export interface HouseholdReadResponse {
  id: string;
  tax_benefit_model_name: string;
  year: number;
  label: string | null;
  people: Record<string, unknown>[];
  tax_unit?: Record<string, unknown> | null;
  family?: Record<string, unknown> | null;
  spm_unit?: Record<string, unknown> | null;
  marital_unit?: Record<string, unknown> | null;
  household?: Record<string, unknown> | null;
  benunit?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ReportFullResponse {
  report: ReportReadResponse;
  baseline_simulation: SimulationInfo | null;
  reform_simulation: SimulationInfo | null;
  baseline_policy: V2PolicyResponse | null;
  reform_policy: V2PolicyResponse | null;
  household: HouseholdReadResponse | null;
  region: AnalysisRegionInfo | null;
  economic_impact: EconomicImpactResponse | null;
  household_impact: HouseholdImpactResponse | null;
}

// ============================================================================
// API Function
// ============================================================================

/**
 * Fetch complete report data in a single call.
 *
 * Read-only: does NOT trigger computation. If the report hasn't been
 * run yet, status will be "pending" and result fields will be null.
 */
export async function fetchReportFull(reportId: string): Promise<ReportFullResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/reports/${reportId}/full`);

  if (!res.ok) {
    throw new Error(`Failed to fetch full report ${reportId}: ${res.status}`);
  }

  return res.json();
}
