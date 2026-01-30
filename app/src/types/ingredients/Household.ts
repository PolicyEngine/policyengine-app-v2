/**
 * Household - The canonical household data structure for API v2 Alpha
 *
 * This represents the household data structure used for simulations,
 * matching the API v2 Alpha format with array-based entities and flat values.
 *
 * Key principles:
 * - Array-based entities with numeric IDs (not named objects)
 * - Flat variable values (year specified at top level, not per-value)
 * - Entity relationships via person_{entity}_id fields on people
 * - snake_case singular entity names (tax_unit, not taxUnits)
 */

export type TaxBenefitModelName = 'policyengine_uk' | 'policyengine_us';

/**
 * Main Household interface matching API v2 Alpha structure
 */
export interface Household {
  /** Job ID from API v2 (only present after calculation) */
  id?: string;

  /** Which country's tax-benefit model to use */
  tax_benefit_model_name: TaxBenefitModelName;

  /** Simulation year - applies to all variable values */
  year: number;

  /** Array of people in the household */
  people: HouseholdPerson[];

  /** US: Tax filing units */
  tax_unit?: HouseholdTaxUnit[];

  /** US: Family units */
  family?: HouseholdFamily[];

  /** US: SPM (Supplemental Poverty Measure) units */
  spm_unit?: HouseholdSpmUnit[];

  /** US: Marital units */
  marital_unit?: HouseholdMaritalUnit[];

  /** Physical household unit */
  household?: HouseholdUnit[];

  /** UK: Benefit units */
  benunit?: HouseholdBenunit[];

  /** Optional display label (not sent to API) */
  label?: string;
}

/**
 * Person in a household
 * Uses numeric IDs for entity relationships
 */
export interface HouseholdPerson {
  /** Unique identifier for this person (0-indexed) */
  person_id?: number;

  /** Display name for UI (not sent to API) */
  name?: string;

  // Entity relationship IDs (which unit this person belongs to)
  person_tax_unit_id?: number;
  person_family_id?: number;
  person_spm_unit_id?: number;
  person_marital_unit_id?: number;
  person_household_id?: number;
  person_benunit_id?: number; // UK only

  // Common variables (flat values, not year-keyed)
  age?: number;
  employment_income?: number;
  is_tax_unit_dependent?: boolean;

  // Allow any other variables
  [key: string]: number | boolean | string | undefined;
}

/**
 * US Tax Unit
 */
export interface HouseholdTaxUnit {
  tax_unit_id?: number;
  state_code?: string;
  [key: string]: number | boolean | string | undefined;
}

/**
 * US Family
 */
export interface HouseholdFamily {
  family_id?: number;
  [key: string]: number | boolean | string | undefined;
}

/**
 * US SPM Unit
 */
export interface HouseholdSpmUnit {
  spm_unit_id?: number;
  [key: string]: number | boolean | string | undefined;
}

/**
 * US Marital Unit
 */
export interface HouseholdMaritalUnit {
  marital_unit_id?: number;
  [key: string]: number | boolean | string | undefined;
}

/**
 * Physical Household Unit
 */
export interface HouseholdUnit {
  household_id?: number;
  state_fips?: number; // US
  region?: string; // UK
  [key: string]: number | boolean | string | undefined;
}

/**
 * UK Benefit Unit
 */
export interface HouseholdBenunit {
  benunit_id?: number;
  is_married?: boolean;
  [key: string]: number | boolean | string | undefined;
}

// ============================================================================
// Legacy type aliases for gradual migration
// These map old type names to new structures during the transition period
// ============================================================================

/**
 * @deprecated Use Household directly - householdData is no longer nested
 */
export type HouseholdData = Omit<Household, 'id' | 'label'>;

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

/**
 * Get the entity ID field name for a given entity type
 */
export function getEntityIdField(entityType: EntityType): string {
  return `${entityType}_id`;
}

/**
 * Get the person-to-entity relationship field name
 */
export function getPersonEntityIdField(entityType: EntityType): string {
  if (entityType === 'person') {
    return 'person_id';
  }
  return `person_${entityType}_id`;
}

/**
 * Get entities for a specific country model
 */
export function getEntitiesForModel(modelName: TaxBenefitModelName): EntityType[] {
  if (modelName === 'policyengine_us') {
    return ['person', 'tax_unit', 'family', 'spm_unit', 'marital_unit', 'household'];
  }
  return ['person', 'benunit', 'household'];
}
