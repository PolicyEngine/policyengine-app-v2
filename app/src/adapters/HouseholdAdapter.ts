/**
 * HouseholdAdapter - Conversion utilities for v2 Alpha household data
 *
 * This adapter works exclusively with the v2 Alpha format.
 * No legacy/v1 conversion logic belongs here.
 * For v1 API boundary conversion, see api/legacyConversion.ts
 */

import { countryIds } from '@/libs/countries';
import { Household, TaxBenefitModelName } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCalculatePayload, householdToCalculatePayload } from '@/types/payloads';

/**
 * Adapter for converting between Household formats
 */
export class HouseholdAdapter {
  /**
   * Extract Household from HouseholdMetadata (storage wrapper)
   */
  static fromMetadata(metadata: HouseholdMetadata): Household {
    return {
      ...metadata.household,
      id: metadata.id,
      label: metadata.label ?? undefined,
    };
  }

  /**
   * Create HouseholdMetadata wrapper for storage
   */
  static toMetadata(household: Household, id?: string): HouseholdMetadata {
    const householdCopy = { ...household };
    delete householdCopy.id;
    delete householdCopy.label;

    return {
      id: id ?? household.id ?? generateHouseholdId(),
      household: householdCopy as Household,
      label: household.label,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Convert Household to API calculation payload
   */
  static toCalculatePayload(
    household: Household,
    policyId?: string,
    dynamicId?: string
  ): HouseholdCalculatePayload {
    return householdToCalculatePayload(household, policyId, dynamicId);
  }

  /**
   * Get the country ID from a Household's tax_benefit_model_name
   */
  static getCountryId(household: Household): (typeof countryIds)[number] {
    return modelNameToCountryId(household.tax_benefit_model_name);
  }

  /**
   * Check if household is for US
   */
  static isUS(household: Household): boolean {
    return household.tax_benefit_model_name === 'policyengine_us';
  }

  /**
   * Check if household is for UK
   */
  static isUK(household: Household): boolean {
    return household.tax_benefit_model_name === 'policyengine_uk';
  }
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert country ID to tax_benefit_model_name
 */
export function countryIdToModelName(countryId: (typeof countryIds)[number]): TaxBenefitModelName {
  switch (countryId) {
    case 'uk':
      return 'policyengine_uk';
    case 'us':
    default:
      return 'policyengine_us';
  }
}

/**
 * Convert tax_benefit_model_name to country ID
 */
export function modelNameToCountryId(modelName: TaxBenefitModelName): (typeof countryIds)[number] {
  switch (modelName) {
    case 'policyengine_uk':
      return 'uk';
    case 'policyengine_us':
    default:
      return 'us';
  }
}

/**
 * Generate a unique household ID for local storage
 */
export function generateHouseholdId(): string {
  return `hh-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
