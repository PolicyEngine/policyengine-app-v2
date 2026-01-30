/**
 * API v2 Alpha Household Metadata Types
 *
 * These types model the API v2 Alpha household job system where:
 * - Households are submitted via POST /household/calculate
 * - Results are polled via GET /household/calculate/{job_id}
 * - Jobs store request_data (input) and result (output) as JSON
 */

import {
  Household,
  HouseholdBenunit,
  HouseholdFamily,
  HouseholdMaritalUnit,
  HouseholdPerson,
  HouseholdSpmUnit,
  HouseholdTaxUnit,
  HouseholdUnit,
  TaxBenefitModelName,
} from '@/types/ingredients/Household';

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
 * The calculated output from a household simulation
 * Contains computed values for all entities
 */
export interface HouseholdCalculationResult {
  person: HouseholdPersonOutput[];
  tax_unit?: HouseholdTaxUnitOutput[];
  family?: HouseholdFamilyOutput[];
  spm_unit?: HouseholdSpmUnitOutput[];
  marital_unit?: HouseholdMaritalUnitOutput[];
  household?: HouseholdUnitOutput[];
  benunit?: HouseholdBenunitOutput[]; // UK only
}

/**
 * Calculated output for a person
 * Contains all computed variables for that person
 */
export interface HouseholdPersonOutput {
  [variableName: string]: number | boolean | string;
}

/**
 * Calculated output for a tax unit
 */
export interface HouseholdTaxUnitOutput {
  [variableName: string]: number | boolean | string;
}

/**
 * Calculated output for a family
 */
export interface HouseholdFamilyOutput {
  [variableName: string]: number | boolean | string;
}

/**
 * Calculated output for an SPM unit
 */
export interface HouseholdSpmUnitOutput {
  [variableName: string]: number | boolean | string;
}

/**
 * Calculated output for a marital unit
 */
export interface HouseholdMaritalUnitOutput {
  [variableName: string]: number | boolean | string;
}

/**
 * Calculated output for a household unit
 */
export interface HouseholdUnitOutput {
  [variableName: string]: number | boolean | string;
}

/**
 * Calculated output for a benefit unit (UK)
 */
export interface HouseholdBenunitOutput {
  [variableName: string]: number | boolean | string;
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

export type {
  Household,
  HouseholdPerson,
  HouseholdTaxUnit,
  HouseholdFamily,
  HouseholdSpmUnit,
  HouseholdMaritalUnit,
  HouseholdUnit,
  HouseholdBenunit,
  TaxBenefitModelName,
};
