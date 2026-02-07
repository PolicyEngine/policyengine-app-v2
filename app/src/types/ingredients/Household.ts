/**
 * Household - The canonical household data structure for API v2 Alpha storage
 *
 * This represents the household data structure used for storage,
 * matching the API v2 Alpha HouseholdCreate format:
 * - People are plain variable dicts (no person_id, name, or membership fields)
 * - Entity groups are single flat dicts (one entity per type for storage)
 * - The API generates IDs and membership server-side during calculation
 * - People are identified by array position + is_tax_unit_dependent (US) or age (UK)
 *
 * Note: The /household/calculate endpoint uses arrays for entity groups to support
 * batch processing. The conversion to arrays happens in HouseholdAdapter.toCalculatePayload().
 */

export type TaxBenefitModelName = 'policyengine_uk' | 'policyengine_us';

/**
 * Main Household interface matching API v2 Alpha HouseholdCreate (storage format)
 */
export interface Household {
  /** Job ID from API v2 (only present after calculation) */
  id?: string;

  /** Which country's tax-benefit model to use */
  tax_benefit_model_name: TaxBenefitModelName;

  /** Simulation year - applies to all variable values */
  year: number;

  /** Array of people in the household - plain variable dicts */
  people: HouseholdPerson[];

  /** US: Tax filing unit (single dict) */
  tax_unit?: Record<string, any>;

  /** US: Family unit (single dict) */
  family?: Record<string, any>;

  /** US: SPM (Supplemental Poverty Measure) unit (single dict) */
  spm_unit?: Record<string, any>;

  /** US: Marital unit (single dict) */
  marital_unit?: Record<string, any>;

  /** Physical household unit (single dict) */
  household?: Record<string, any>;

  /** UK: Benefit unit (single dict) */
  benunit?: Record<string, any>;

  /** Optional display label (not sent to API) */
  label?: string;
}

/**
 * Person in a household - plain variable dict
 * No person_id, name, or person_*_id membership fields.
 * People are identified by array index.
 */
export interface HouseholdPerson {
  // Common variables (flat values, not year-keyed)
  age?: number;
  employment_income?: number;
  is_tax_unit_dependent?: boolean;

  // Allow any other variables
  [key: string]: number | boolean | string | undefined;
}

// ============================================================================
// Utility types
// ============================================================================

/**
 * Entity types available for US households
 */
export type USEntityType =
  | 'person'
  | 'tax_unit'
  | 'family'
  | 'spm_unit'
  | 'marital_unit'
  | 'household';

/**
 * Entity types available for UK households
 */
export type UKEntityType = 'person' | 'benunit' | 'household';

/**
 * All possible entity types
 */
export type EntityType = USEntityType | UKEntityType;

