/**
 * Household Calculation API - v2 Alpha
 *
 * This module handles household calculations via the API v2 Alpha /household/calculate endpoint.
 * The v2 alpha API is async (create job, poll for results).
 *
 * Note: Variation/axes calculations are NOT supported in v2 alpha and remain on v1.
 */

import type { CountryId } from '@/libs/countries';
import { API_V2_BASE_URL } from './taxBenefitModels';

/**
 * V2-specific flat household shape used by calculation endpoints.
 * This is the v2 API's native format — conversion from the app's
 * internal Household type happens in the adapter layer (Phase 2).
 */
export interface V2HouseholdShape {
  id?: string;
  country_id: CountryId;
  year: number;
  label?: string | null;
  people: Record<string, any>[];
  tax_unit?: Record<string, any> | null;
  family?: Record<string, any> | null;
  spm_unit?: Record<string, any> | null;
  marital_unit?: Record<string, any> | null;
  household?: Record<string, any> | null;
  benunit?: Record<string, any> | null;
}

/**
 * Payload sent to POST /household/calculate
 */
export interface HouseholdCalculatePayload {
  country_id: CountryId;
  year: number;
  people: Record<string, any>[];
  tax_unit?: Record<string, any> | null;
  family?: Record<string, any> | null;
  spm_unit?: Record<string, any> | null;
  marital_unit?: Record<string, any> | null;
  household?: Record<string, any> | null;
  benunit?: Record<string, any> | null;
  policy_id?: string;
  dynamic_id?: string;
}

function householdToCalculatePayload(
  household: V2HouseholdShape,
  policyId?: string,
  dynamicId?: string,
): HouseholdCalculatePayload {
  return {
    country_id: household.country_id,
    year: household.year,
    people: household.people,
    tax_unit: household.tax_unit ?? null,
    family: household.family ?? null,
    spm_unit: household.spm_unit ?? null,
    marital_unit: household.marital_unit ?? null,
    household: household.household ?? null,
    benunit: household.benunit ?? null,
    policy_id: policyId,
    dynamic_id: dynamicId,
  };
}

// ============================================================================
// Types for v2 Alpha /household/calculate API
// ============================================================================

export type HouseholdJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/**
 * Response from POST /household/calculate (job creation)
 */
export interface HouseholdJobResponse {
  job_id: string;
  status: HouseholdJobStatus;
}

/**
 * Response from GET /household/calculate/{job_id} (job status)
 */
export interface HouseholdJobStatusResponse {
  job_id: string;
  status: HouseholdJobStatus;
  result: HouseholdCalculationResult | null;
  error_message: string | null;
}

/**
 * Calculation result structure from v2 alpha
 */
export interface HouseholdCalculationResult {
  person: Record<string, any>[];
  benunit?: Record<string, any>[] | null;
  marital_unit?: Record<string, any>[] | null;
  family?: Record<string, any>[] | null;
  spm_unit?: Record<string, any>[] | null;
  tax_unit?: Record<string, any>[] | null;
  household: Record<string, any>[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a household calculation job in v2 alpha API
 * Returns the job ID for polling
 */
export async function createHouseholdCalculationJobV2(
  payload: HouseholdCalculatePayload
): Promise<HouseholdJobResponse> {
  const url = `${API_V2_BASE_URL}/household/calculate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create calculation job: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Get the status and result of a household calculation job
 */
export async function getHouseholdCalculationJobStatusV2(
  jobId: string
): Promise<HouseholdJobStatusResponse> {
  const url = `${API_V2_BASE_URL}/household/calculate/${jobId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Calculation job ${jobId} not found`);
    }
    const errorText = await res.text();
    throw new Error(`Failed to get job status: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Poll for calculation job completion with timeout
 */
export async function pollHouseholdCalculationJobV2(
  jobId: string,
  options: {
    pollIntervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<HouseholdCalculationResult> {
  const { pollIntervalMs = 1000, timeoutMs = 240000 } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getHouseholdCalculationJobStatusV2(jobId);

    if (status.status === 'COMPLETED') {
      if (!status.result) {
        throw new Error('Calculation completed but no result returned');
      }
      return status.result;
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error_message || 'Calculation failed');
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Calculation timed out after 4 minutes');
}

/**
 * Convert v2 alpha calculation result to Household format
 */
export function calculationResultToHousehold(
  result: HouseholdCalculationResult,
  originalHousehold: V2HouseholdShape
): V2HouseholdShape {
  return {
    country_id: originalHousehold.country_id,
    year: originalHousehold.year,
    people: result.person,
    // Extract first element from arrays (single household case)
    tax_unit: result.tax_unit?.[0] ?? undefined,
    family: result.family?.[0] ?? undefined,
    spm_unit: result.spm_unit?.[0] ?? undefined,
    marital_unit: result.marital_unit?.[0] ?? undefined,
    household: result.household?.[0] ?? undefined,
    benunit: result.benunit?.[0] ?? undefined,
  };
}

/**
 * High-level function: Calculate household using v2 alpha API
 * Creates job, polls for result, returns Household
 */
export async function calculateHouseholdV2Alpha(
  household: V2HouseholdShape,
  policyId?: string,
  dynamicId?: string,
  options: {
    pollIntervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<V2HouseholdShape> {
  // Convert to calculation payload format (arrays)
  const payload = householdToCalculatePayload(household, policyId, dynamicId);

  // Create calculation job
  const job = await createHouseholdCalculationJobV2(payload);

  // Poll for completion
  const result = await pollHouseholdCalculationJobV2(job.job_id, options);

  // Convert result back to Household format
  return calculationResultToHousehold(result, household);
}
