/**
 * API v2 Alpha Household Payload Types
 *
 * These types define the request payloads for household operations in API v2 Alpha.
 * The main endpoint is POST /household/calculate which accepts the household
 * directly (no nested data wrapper).
 *
 * Entity groups are arrays of flat dicts (supporting multiple entities).
 */

import { Household, HouseholdPerson, TaxBenefitModelName } from '@/types/ingredients/Household';

/**
 * Payload for creating a household calculation job
 * POST /household/calculate
 *
 * Entity groups are arrays of dicts matching API v2 Alpha HouseholdCalculateRequest.
 */
export interface HouseholdCalculatePayload {
  /** Which country's tax-benefit model to use */
  tax_benefit_model_name: TaxBenefitModelName;

  /** Simulation year */
  year: number;

  /** Array of people in the household */
  people: HouseholdPerson[];

  /** US: Tax filing units (array of dicts) */
  tax_unit?: Record<string, any>[];

  /** US: Family units (array of dicts) */
  family?: Record<string, any>[];

  /** US: SPM units (array of dicts) */
  spm_unit?: Record<string, any>[];

  /** US: Marital units (array of dicts) */
  marital_unit?: Record<string, any>[];

  /** Physical household units (array of dicts) */
  household?: Record<string, any>[];

  /** UK: Benefit units (array of dicts) */
  benunit?: Record<string, any>[];

  /** Optional policy ID for reform scenario */
  policy_id?: string;

  /** Optional dynamic/behavioral response ID */
  dynamic_id?: string;
}

/**
 * Payload for household impact comparison
 * POST /household/impact
 */
export interface HouseholdImpactPayload extends HouseholdCalculatePayload {
  /** Required: Reform policy ID to compare against baseline */
  policy_id: string;
}

/**
 * Convert a Household (storage format with single dicts) to an API calculation payload
 * (calculation format with arrays).
 *
 * The /household/calculate endpoint expects arrays for entity groups to support
 * batch processing of multiple households. For single household calculations,
 * we wrap each entity dict in an array.
 */
export function householdToCalculatePayload(
  household: Household,
  policyId?: string,
  dynamicId?: string
): HouseholdCalculatePayload {
  const payload: HouseholdCalculatePayload = {
    tax_benefit_model_name: household.tax_benefit_model_name,
    year: household.year,
    people: household.people,
  };

  // Wrap single entity dicts in arrays for the calculation endpoint
  if (household.tax_unit) {
    payload.tax_unit = [household.tax_unit];
  }
  if (household.family) {
    payload.family = [household.family];
  }
  if (household.spm_unit) {
    payload.spm_unit = [household.spm_unit];
  }
  if (household.marital_unit) {
    payload.marital_unit = [household.marital_unit];
  }
  if (household.household) {
    payload.household = [household.household];
  }
  if (household.benunit) {
    payload.benunit = [household.benunit];
  }

  // Add optional IDs
  if (policyId) {
    payload.policy_id = policyId;
  }
  if (dynamicId) {
    payload.dynamic_id = dynamicId;
  }

  return payload;
}
