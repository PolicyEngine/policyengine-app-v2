/**
 * API v2 Alpha Household Metadata Types
 *
 * These types model the API v2 Alpha household job system where:
 * - Households are submitted via POST /household/calculate
 * - Results are polled via GET /household/calculate/{job_id}
 * - Jobs store request_data (input) and result (output) as JSON
 */

import { Household, HouseholdPerson, TaxBenefitModelName } from '@/types/ingredients/Household';

// ============================================================================
// API v2 Alpha Job Types
// ============================================================================

/**
 * Status of a household calculation job
 */
export type HouseholdJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Response from creating a household calculation job
 * POST /household/calculate
 */
export interface HouseholdJobCreateResponse {
  job_id: string;
  status: HouseholdJobStatus;
}

/**
 * Response from polling a household calculation job
 * GET /household/calculate/{job_id}
 */
export interface HouseholdJobStatusResponse {
  job_id: string;
  status: HouseholdJobStatus;
  result?: HouseholdCalculationResult;
  error_message?: string | null;
}

/**
 * The calculated output from a household simulation.
 * Matches HouseholdCalculateResponse from API v2 Alpha:
 * - person: array of dicts (one per person)
 * - entity groups: array of dicts or null
 * - household: single dict (NOT an array)
 */
export interface HouseholdCalculationResult {
  person: Record<string, any>[];
  tax_unit?: Record<string, any>[] | null;
  family?: Record<string, any>[] | null;
  spm_unit?: Record<string, any>[] | null;
  marital_unit?: Record<string, any>[] | null;
  household?: Record<string, any>;
  benunit?: Record<string, any>[] | null;
}

// ============================================================================
// Household Metadata for Storage/Association
// ============================================================================

/**
 * Metadata for a stored household (in localStorage or future API)
 * This wraps a Household with additional metadata for user association
 */
export interface HouseholdMetadata {
  /** Unique identifier for this stored household */
  id: string;

  /** The household data in v2 format */
  household: Household;

  /** User-provided label */
  label?: string | null;

  /** When this was created */
  created_at?: string;

  /** When this was last updated */
  updated_at?: string;
}

// ============================================================================
// Impact Comparison Types
// ============================================================================

/**
 * Request for household impact comparison
 * POST /household/impact
 */
export interface HouseholdImpactRequest extends Omit<Household, 'id' | 'label'> {
  policy_id: string; // Reform policy to compare against baseline
  dynamic_id?: string; // Optional behavioral response
}

/**
 * Response from household impact comparison
 */
export interface HouseholdImpactResponse {
  job_id: string;
  status: HouseholdJobStatus;
  baseline_result?: HouseholdCalculationResult;
  reform_result?: HouseholdCalculationResult;
  impact?: HouseholdImpactDiff;
  error_message?: string | null;
}

/**
 * Computed differences between baseline and reform
 */
export interface HouseholdImpactDiff {
  [variableName: string]: {
    baseline: number;
    reform: number;
    change: number;
  };
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { Household, HouseholdPerson, TaxBenefitModelName };
