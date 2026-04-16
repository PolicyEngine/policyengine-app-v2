/**
 * Household Calculation API - v2 Alpha
 *
 * This module handles household calculations via the API v2 Alpha /household/calculate endpoint.
 * The v2 alpha API is async (create job, poll for results).
 *
 * Note: Variation/axes calculations are NOT supported in v2 alpha and remain on v1.
 */

import type {
  V2CreateHouseholdEnvelope,
  V2HouseholdCalculationPayload,
  V2HouseholdCalculationResult,
  V2HouseholdEnvelope,
  V2StoredHouseholdEnvelope,
  V2UKCreateHouseholdEnvelope,
  V2UKHouseholdCalculationResult,
  V2USCreateHouseholdEnvelope,
  V2USHouseholdCalculationResult,
} from '@/models/household/v2Types';
import { API_V2_BASE_URL } from './taxBenefitModels';
import { cancellableSleep, v2Fetch } from './v2Fetch';

export type { V2CreateHouseholdEnvelope, V2StoredHouseholdEnvelope };

export type HouseholdCalculatePayload = V2HouseholdCalculationPayload;
export type HouseholdCalculationResult = V2HouseholdCalculationResult;

function householdToCalculatePayload(
  household: V2HouseholdEnvelope,
  policyId?: string,
  dynamicId?: string
): HouseholdCalculatePayload {
  switch (household.country_id) {
    case 'us':
      return {
        country_id: 'us',
        year: household.year,
        people: household.people,
        tax_unit: household.tax_unit,
        family: household.family,
        spm_unit: household.spm_unit,
        marital_unit: household.marital_unit,
        household: household.household,
        policy_id: policyId,
        dynamic_id: dynamicId,
      };
    case 'uk':
      return {
        country_id: 'uk',
        year: household.year,
        people: household.people,
        household: household.household,
        benunit: household.benunit,
        policy_id: policyId,
        dynamic_id: dynamicId,
      };
  }
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

  return v2Fetch<HouseholdJobResponse>(url, 'createHouseholdCalculationJobV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Get the status and result of a household calculation job.
 * Throws with status code in message on any error (including 404).
 */
export async function getHouseholdCalculationJobStatusV2(
  jobId: string
): Promise<HouseholdJobStatusResponse> {
  const url = `${API_V2_BASE_URL}/household/calculate/${jobId}`;

  return v2Fetch<HouseholdJobStatusResponse>(url, `getHouseholdCalculationJobStatusV2(${jobId})`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
}

/**
 * Poll for calculation job completion with timeout.
 * Supports AbortSignal for cancellation and retries transient errors up to 3 times.
 */
export async function pollHouseholdCalculationJobV2(
  jobId: string,
  options: {
    pollIntervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {}
): Promise<HouseholdCalculationResult> {
  const { pollIntervalMs = 1000, timeoutMs = 240000, signal } = options;
  const maxTransientRetries = 3;

  const startTime = Date.now();
  let consecutiveErrors = 0;

  while (Date.now() - startTime < timeoutMs) {
    let status: HouseholdJobStatusResponse;
    try {
      status = await getHouseholdCalculationJobStatusV2(jobId);
      consecutiveErrors = 0;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      consecutiveErrors++;
      if (consecutiveErrors > maxTransientRetries) {
        throw error;
      }
      console.warn(
        `[v2 API] Transient error polling job ${jobId} (attempt ${consecutiveErrors}/${maxTransientRetries}):`,
        error
      );
      await cancellableSleep(pollIntervalMs, signal);
      continue;
    }

    if (status.status === 'COMPLETED') {
      if (!status.result) {
        throw new Error('Calculation completed but no result returned');
      }
      return status.result;
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error_message || 'Calculation failed');
    }

    await cancellableSleep(pollIntervalMs, signal);
  }

  throw new Error(`Calculation job ${jobId} timed out after ${timeoutMs / 1000}s`);
}

/**
 * Convert v2 alpha calculation result to Household format
 */
export function calculationResultToHousehold(
  result: HouseholdCalculationResult,
  originalHousehold: V2HouseholdEnvelope
): V2CreateHouseholdEnvelope {
  switch (originalHousehold.country_id) {
    case 'us':
      return {
        country_id: 'us',
        year: originalHousehold.year,
        label: originalHousehold.label,
        people: (result as V2USHouseholdCalculationResult).person,
        tax_unit: (result as V2USHouseholdCalculationResult).tax_unit ?? [],
        family: (result as V2USHouseholdCalculationResult).family ?? [],
        spm_unit: (result as V2USHouseholdCalculationResult).spm_unit ?? [],
        marital_unit: (result as V2USHouseholdCalculationResult).marital_unit ?? [],
        household: (result as V2USHouseholdCalculationResult).household ?? [],
      } satisfies V2USCreateHouseholdEnvelope;
    case 'uk':
      return {
        country_id: 'uk',
        year: originalHousehold.year,
        label: originalHousehold.label,
        people: (result as V2UKHouseholdCalculationResult).person,
        household: (result as V2UKHouseholdCalculationResult).household ?? [],
        benunit: (result as V2UKHouseholdCalculationResult).benunit ?? [],
      } satisfies V2UKCreateHouseholdEnvelope;
  }
}

/**
 * High-level function: Calculate household using v2 alpha API
 * Creates job, polls for result, returns Household
 */
export async function calculateHouseholdV2Alpha(
  household: V2HouseholdEnvelope,
  policyId?: string,
  dynamicId?: string,
  options: {
    pollIntervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {}
): Promise<V2CreateHouseholdEnvelope> {
  // Convert to calculation payload format (arrays)
  const payload = householdToCalculatePayload(household, policyId, dynamicId);

  // Create calculation job
  const job = await createHouseholdCalculationJobV2(payload);

  // Poll for completion
  const result = await pollHouseholdCalculationJobV2(job.job_id, options);

  // Convert result back to Household format
  return calculationResultToHousehold(result, household);
}
