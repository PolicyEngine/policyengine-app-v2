/**
 * HouseholdAdapter - Conversion utilities for v2 Alpha household data
 *
 * This adapter works exclusively with the v2 Alpha format.
 * No legacy/v1 conversion logic belongs here.
 * For v1 API boundary conversion, see api/legacyConversion.ts
 */

import { countryIds, type CountryId } from '@/libs/countries';
import { Household } from '@/types/ingredients/Household';
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
   * Get the country ID from a Household
   */
  static getCountryId(household: Household): (typeof countryIds)[number] {
    return household.country_id;
  }

  /**
   * Check if household is for US
   */
  static isUS(household: Household): boolean {
    return household.country_id === 'us';
  }

  /**
   * Check if household is for UK
   */
  static isUK(household: Household): boolean {
    return household.country_id === 'uk';
  }
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * @deprecated Use country_id directly — no conversion needed.
 */
export function countryIdToModelName(countryId: (typeof countryIds)[number]): CountryId {
  return countryId;
}

/**
 * @deprecated Use country_id directly — no conversion needed.
 */
export function modelNameToCountryId(modelName: CountryId): (typeof countryIds)[number] {
  return modelName;
}

/**
 * Generate a unique household ID for local storage
 */
export function generateHouseholdId(): string {
  return `hh-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
