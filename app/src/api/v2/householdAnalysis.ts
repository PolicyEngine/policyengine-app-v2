/**
 * Household Analysis API - v2 Alpha
 *
 * Handles household-level baseline vs reform comparison analysis via the API v2 alpha.
 * The endpoint creates a report with baseline + reform household simulations,
 * computes per-variable diffs across all entity types, and returns structured results.
 *
 * API Endpoints:
 * - POST /analysis/household-impact              - Create household analysis
 * - GET  /analysis/household-impact/{report_id}   - Poll/retrieve results
 */

import { Report } from '@/types/ingredients/Report';
import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types
// ============================================================================

export type HouseholdReportStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface HouseholdSimulationInfo {
  id: string;
  status: string;
  error_message: string | null;
}

/** POST /analysis/household-impact request body */
export interface HouseholdImpactRequest {
  household_id: string;
  policy_id?: string | null;
  dynamic_id?: string | null;
}

/** Response from POST and GET /analysis/household-impact */
export interface HouseholdImpactResponse {
  report_id: string;
  report_type: string;
  status: HouseholdReportStatus;
  baseline_simulation: HouseholdSimulationInfo | null;
  reform_simulation: HouseholdSimulationInfo | null;
  baseline_result: Record<string, any> | null;
  reform_result: Record<string, any> | null;
  impact: Record<string, any> | null;
  error_message: string | null;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/** Map API report status to app domain status */
function toAppStatus(status: HouseholdReportStatus): Report['status'] {
  switch (status) {
    case 'completed':
      return 'complete';
    case 'failed':
      return 'error';
    default:
      return 'pending';
  }
}

/** Convert household impact response to app Report */
export function fromHouseholdImpactResponse(response: HouseholdImpactResponse): Report {
  const simulationIds: string[] = [];
  if (response.baseline_simulation) {
    simulationIds.push(response.baseline_simulation.id);
  }
  if (response.reform_simulation) {
    simulationIds.push(response.reform_simulation.id);
  }

  return {
    id: response.report_id,
    countryId: 'us', // Caller should override based on context
    year: new Date().getFullYear().toString(),
    apiVersion: 'v2',
    simulationIds,
    status: toAppStatus(response.status),
    outputType: 'household',
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a household impact analysis (baseline vs reform comparison).
 * POST /analysis/household-impact
 */
export async function createHouseholdAnalysis(
  request: HouseholdImpactRequest
): Promise<HouseholdImpactResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/analysis/household-impact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create household analysis: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Get household analysis status and results.
 * GET /analysis/household-impact/{report_id}
 */
export async function getHouseholdAnalysis(reportId: string): Promise<HouseholdImpactResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/analysis/household-impact/${reportId}`, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    throw new Error(`Household analysis report ${reportId} not found`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get household analysis: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Poll household analysis until completed or failed.
 */
export async function pollHouseholdAnalysis(
  reportId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<HouseholdImpactResponse> {
  const { pollIntervalMs = 1000, timeoutMs = 240000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await getHouseholdAnalysis(reportId);

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Household analysis failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Household analysis timed out');
}
