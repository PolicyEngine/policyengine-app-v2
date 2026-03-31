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
import type { PolicyIdInput, ReportStatus, SimulationInfo } from './types';
import { cancellableSleep, v2Fetch } from './v2Fetch';

// ============================================================================
// Types
// ============================================================================

// Re-export shared types for backwards compatibility
export type {
  ReportStatus as HouseholdReportStatus,
  SimulationInfo as HouseholdSimulationInfo,
  PolicyIdInput,
};

/** POST /analysis/household-impact request body */
export interface HouseholdImpactRequest {
  household_id: string;
  baseline_policy_id?: PolicyIdInput;
  reform_policy_id?: PolicyIdInput;
  dynamic_id?: string | null;
  run?: boolean;
}

/** Response from POST and GET /analysis/household-impact */
export interface HouseholdImpactResponse {
  report_id: string;
  report_type: string;
  status: ReportStatus;
  baseline_simulation: SimulationInfo | null;
  reform_simulation: SimulationInfo | null;
  baseline_result: Record<string, any> | null;
  reform_result: Record<string, any> | null;
  impact: Record<string, any> | null;
  error_message: string | null;
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
      console.warn(`[v2 API] Unknown household report status: "${status}"`);
      return 'pending';
  }
}

/** Convert household impact response to app Report */
export function fromHouseholdImpactResponse(
  response: HouseholdImpactResponse,
  countryId: Report['countryId'],
  year: string
): Report {
  const simulationIds: string[] = [];
  if (response.baseline_simulation) {
    simulationIds.push(response.baseline_simulation.id);
  }
  if (response.reform_simulation) {
    simulationIds.push(response.reform_simulation.id);
  }

  return {
    id: response.report_id,
    countryId,
    year,
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
  return v2Fetch<HouseholdImpactResponse>(
    `${API_V2_BASE_URL}/analysis/household-impact`,
    'createHouseholdAnalysis',
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
 * Get household analysis status and results.
 * GET /analysis/household-impact/{report_id}
 */
export async function getHouseholdAnalysis(reportId: string): Promise<HouseholdImpactResponse> {
  return v2Fetch<HouseholdImpactResponse>(
    `${API_V2_BASE_URL}/analysis/household-impact/${reportId}`,
    'getHouseholdAnalysis',
    { headers: { Accept: 'application/json' } }
  );
}

/**
 * Poll household analysis until completed or failed.
 */
export async function pollHouseholdAnalysis(
  reportId: string,
  options: { pollIntervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<HouseholdImpactResponse> {
  const { pollIntervalMs = 1000, timeoutMs = 240000, signal } = options;
  const startTime = Date.now();
  const maxTransientRetries = 3;
  let transientFailures = 0;

  while (Date.now() - startTime < timeoutMs) {
    let response: HouseholdImpactResponse;
    try {
      response = await getHouseholdAnalysis(reportId);
      transientFailures = 0;
    } catch (err) {
      transientFailures++;
      if (transientFailures >= maxTransientRetries) {
        throw err;
      }
      console.warn(
        `[v2 API] pollHouseholdAnalysis: transient error (${transientFailures}/${maxTransientRetries})`,
        err
      );
      await cancellableSleep(pollIntervalMs, signal);
      continue;
    }

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error_message || 'Household analysis failed');
    }

    await cancellableSleep(pollIntervalMs, signal);
  }

  throw new Error(`Household analysis timed out for report ${reportId}`);
}
