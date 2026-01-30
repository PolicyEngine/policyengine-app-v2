/**
 * API v2 Alpha Household Payload Types
 *
 * These types define the request payloads for household operations in API v2 Alpha.
 * The main endpoint is POST /household/calculate which accepts the household
 * directly (no nested data wrapper).
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

/**
 * Payload for creating a household calculation job
 * POST /household/calculate
 *
 * This is essentially the Household interface without the id and label fields
 */
export interface HouseholdCalculatePayload {
  /** Which country's tax-benefit model to use */
  tax_benefit_model_name: TaxBenefitModelName;

  /** Simulation year */
  year: number;

  /** Array of people in the household */
  people: HouseholdPerson[];

  /** US: Tax filing units */
  tax_unit?: HouseholdTaxUnit[];

  /** US: Family units */
  family?: HouseholdFamily[];

  /** US: SPM units */
  spm_unit?: HouseholdSpmUnit[];

  /** US: Marital units */
  marital_unit?: HouseholdMaritalUnit[];

  /** Physical household unit */
  household?: HouseholdUnit[];

  /** UK: Benefit units */
  benunit?: HouseholdBenunit[];

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
 * Convert a Household to an API calculation payload
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

  // Add entity arrays if present
  if (household.tax_unit) payload.tax_unit = household.tax_unit;
  if (household.family) payload.family = household.family;
  if (household.spm_unit) payload.spm_unit = household.spm_unit;
  if (household.marital_unit) payload.marital_unit = household.marital_unit;
  if (household.household) payload.household = household.household;
  if (household.benunit) payload.benunit = household.benunit;

  // Add optional IDs
  if (policyId) payload.policy_id = policyId;
  if (dynamicId) payload.dynamic_id = dynamicId;

  return payload;
}

