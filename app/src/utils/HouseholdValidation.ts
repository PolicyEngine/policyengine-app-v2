/**
 * HouseholdValidation - Validation utilities for API v2 Alpha household structure
 *
 * These functions validate the array-based household structure where:
 * - People are in arrays with person_id
 * - Values are flat (no year-keying)
 * - Entity relationships are via person_{entity}_id fields
 * - tax_benefit_model_name identifies the country model
 */

import { RootState } from '@/store';
import { Household, HouseholdPerson, TaxBenefitModelName } from '@/types/ingredients/Household';
import { VariableMetadata } from '@/types/metadata';
import * as HouseholdQueries from './HouseholdQueries';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Validation utilities for Household structures
 * Model-agnostic base validation with model-specific extensions
 */
export const HouseholdValidation = {
  /**
   * Validate a household for a specific model
   */
  validateForModel(household: Household, expectedModelName: TaxBenefitModelName): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if model matches
    if (household.tax_benefit_model_name !== expectedModelName) {
      errors.push({
        code: 'MODEL_MISMATCH',
        message: `Household model ${household.tax_benefit_model_name} does not match expected ${expectedModelName}`,
        field: 'tax_benefit_model_name',
      });
    }

    // Generic validation
    this.validateGenericHousehold(household, errors, warnings);

    // Model-specific validation
    if (HouseholdQueries.isUSHousehold(household)) {
      this.validateUSHousehold(household, errors, warnings);
    } else if (HouseholdQueries.isUKHousehold(household)) {
      this.validateUKHousehold(household, errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Generic household validation applicable to all models
   */
  validateGenericHousehold(
    household: Household,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate year is present and reasonable
    if (!household.year) {
      errors.push({
        code: 'MISSING_YEAR',
        message: 'Household must have a simulation year',
        field: 'year',
      });
    } else if (household.year < 2000 || household.year > 2100) {
      warnings.push({
        code: 'UNUSUAL_YEAR',
        message: `Year ${household.year} seems unusual`,
        field: 'year',
      });
    }

    // Validate people array
    if (!Array.isArray(household.people)) {
      errors.push({
        code: 'INVALID_PEOPLE',
        message: 'Household must have a people array',
        field: 'people',
      });
      return;
    }

    // Validate each person has an ID and reasonable age
    household.people.forEach((person, index) => {
      if (person.person_id === undefined) {
        errors.push({
          code: 'MISSING_PERSON_ID',
          message: `Person at index ${index} is missing person_id`,
          field: `people[${index}].person_id`,
        });
      }

      if (person.age === undefined) {
        warnings.push({
          code: 'MISSING_AGE',
          message: `Person ${person.name ?? person.person_id} is missing age`,
          field: `people[${index}].age`,
        });
      } else if (person.age < 0 || person.age > 120) {
        warnings.push({
          code: 'UNUSUAL_AGE',
          message: `Person ${person.name ?? person.person_id} has unusual age: ${person.age}`,
          field: `people[${index}].age`,
        });
      }
    });

    // Check for duplicate person IDs
    const personIds = household.people.map((p) => p.person_id).filter((id) => id !== undefined);
    const uniqueIds = new Set(personIds);
    if (personIds.length !== uniqueIds.size) {
      errors.push({
        code: 'DUPLICATE_PERSON_IDS',
        message: 'Duplicate person_id values found',
        field: 'people',
      });
    }
  },

  /**
   * US-specific validation
   */
  validateUSHousehold(
    household: Household,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const personCount = HouseholdQueries.getPersonCount(household);

    // Validate tax units
    if (personCount > 0) {
      if (!household.tax_unit || household.tax_unit.length === 0) {
        warnings.push({
          code: 'NO_TAX_UNITS',
          message: 'US households with people typically have at least one tax unit',
          field: 'tax_unit',
        });
      } else {
        // Check that all people are assigned to a tax unit
        const peopleWithoutTaxUnit = household.people.filter(
          (p) => p.person_tax_unit_id === undefined
        );
        if (peopleWithoutTaxUnit.length > 0) {
          warnings.push({
            code: 'PEOPLE_WITHOUT_TAX_UNIT',
            message: `${peopleWithoutTaxUnit.length} person(s) not assigned to any tax unit`,
            field: 'people',
          });
        }

        // Validate tax unit IDs exist
        const taxUnitIds = new Set(household.tax_unit.map((t) => t.tax_unit_id));
        household.people.forEach((person) => {
          if (
            person.person_tax_unit_id !== undefined &&
            !taxUnitIds.has(person.person_tax_unit_id)
          ) {
            errors.push({
              code: 'INVALID_TAX_UNIT_REFERENCE',
              message: `Person ${person.name ?? person.person_id} references non-existent tax_unit_id ${person.person_tax_unit_id}`,
              field: `people.person_tax_unit_id`,
            });
          }
        });
      }
    }

    // Validate marital units
    if (household.marital_unit) {
      household.marital_unit.forEach((unit, index) => {
        const membersInUnit = household.people.filter(
          (p) => p.person_marital_unit_id === unit.marital_unit_id
        );
        if (membersInUnit.length === 0 || membersInUnit.length > 2) {
          errors.push({
            code: 'INVALID_MARITAL_UNIT',
            message: `Marital unit ${unit.marital_unit_id} has ${membersInUnit.length} members (must be 1 or 2)`,
            field: `marital_unit[${index}]`,
          });
        }
      });
    }

    // Validate SPM units
    if (household.spm_unit) {
      const spmUnitIds = new Set(household.spm_unit.map((s) => s.spm_unit_id));
      household.people.forEach((person) => {
        if (person.person_spm_unit_id !== undefined && !spmUnitIds.has(person.person_spm_unit_id)) {
          errors.push({
            code: 'INVALID_SPM_UNIT_REFERENCE',
            message: `Person ${person.name ?? person.person_id} references non-existent spm_unit_id ${person.person_spm_unit_id}`,
            field: 'people.person_spm_unit_id',
          });
        }
      });
    }

    // Validate families
    if (household.family) {
      const familyIds = new Set(household.family.map((f) => f.family_id));
      household.people.forEach((person) => {
        if (person.person_family_id !== undefined && !familyIds.has(person.person_family_id)) {
          errors.push({
            code: 'INVALID_FAMILY_REFERENCE',
            message: `Person ${person.name ?? person.person_id} references non-existent family_id ${person.person_family_id}`,
            field: 'people.person_family_id',
          });
        }
      });
    }
  },

  /**
   * UK-specific validation
   */
  validateUKHousehold(household: Household, errors: ValidationError[]): void {
    const personCount = HouseholdQueries.getPersonCount(household);

    // Validate benefit units
    if (personCount > 0 && household.benunit) {
      // Check for empty benefit units
      household.benunit.forEach((unit, index) => {
        const membersInUnit = household.people.filter(
          (p) => p.person_benunit_id === unit.benunit_id
        );
        if (membersInUnit.length === 0) {
          errors.push({
            code: 'EMPTY_BENUNIT',
            message: `Benefit unit ${unit.benunit_id} has no members`,
            field: `benunit[${index}]`,
          });
        }
      });

      // Validate benunit ID references
      const benunitIds = new Set(household.benunit.map((b) => b.benunit_id));
      household.people.forEach((person) => {
        if (person.person_benunit_id !== undefined && !benunitIds.has(person.person_benunit_id)) {
          errors.push({
            code: 'INVALID_BENUNIT_REFERENCE',
            message: `Person ${person.name ?? person.person_id} references non-existent benunit_id ${person.person_benunit_id}`,
            field: 'people.person_benunit_id',
          });
        }
      });
    }

    // Validate household unit
    if (household.household) {
      const householdIds = new Set(household.household.map((h) => h.household_id));
      household.people.forEach((person) => {
        if (
          person.person_household_id !== undefined &&
          !householdIds.has(person.person_household_id)
        ) {
          errors.push({
            code: 'INVALID_HOUSEHOLD_REFERENCE',
            message: `Person ${person.name ?? person.person_id} references non-existent household_id ${person.person_household_id}`,
            field: 'people.person_household_id',
          });
        }
      });
    }
  },

  /**
   * Check if a variable can be added to a specific entity
   */
  canAddVariable(entityType: string, metadata?: VariableMetadata): boolean {
    // If metadata is provided, check entity type matches
    if (metadata && metadata.entity !== entityType) {
      return false;
    }

    // All valid entity types are allowed
    const validEntities = [
      'person',
      'tax_unit',
      'family',
      'spm_unit',
      'marital_unit',
      'household',
      'benunit',
    ];
    return validEntities.includes(entityType);
  },

  /**
   * Validate a variable value
   */
  validateVariableValue(value: unknown, metadata: VariableMetadata): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type checking based on V2 API data_type
    switch (metadata.data_type) {
      case 'float':
      case 'int':
        if (typeof value !== 'number') {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Variable ${metadata.name} must be a number`,
            field: metadata.name,
          });
        } else if (metadata.data_type === 'int' && !Number.isInteger(value)) {
          errors.push({
            code: 'NOT_INTEGER',
            message: `Variable ${metadata.name} must be an integer`,
            field: metadata.name,
          });
        }
        break;

      case 'bool':
        if (typeof value !== 'boolean') {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Variable ${metadata.name} must be a boolean`,
            field: metadata.name,
          });
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Variable ${metadata.name} must be a string`,
            field: metadata.name,
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Check if household structure is complete enough for simulation
   */
  isReadyForSimulation(household: Household): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Must have at least one person
    if (HouseholdQueries.getPersonCount(household) === 0) {
      errors.push({
        code: 'NO_PEOPLE',
        message: 'Household must have at least one person for simulation',
        field: 'people',
      });
    }

    // Must have a year
    if (!household.year) {
      errors.push({
        code: 'NO_YEAR',
        message: 'Household must have a simulation year',
        field: 'year',
      });
    }

    // Must have a model name
    if (!household.tax_benefit_model_name) {
      errors.push({
        code: 'NO_MODEL',
        message: 'Household must have a tax_benefit_model_name',
        field: 'tax_benefit_model_name',
      });
    }

    // Validate structure for the model
    if (household.tax_benefit_model_name) {
      const structureValidation = this.validateForModel(
        household,
        household.tax_benefit_model_name
      );
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate person entity relationships are consistent
   */
  validateEntityRelationships(household: Household): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    household.people.forEach((person) => {
      const personLabel = person.name ?? `Person ${person.person_id}`;

      // For US households, check all entity references
      if (HouseholdQueries.isUSHousehold(household)) {
        const hasAllUSRefs =
          person.person_tax_unit_id !== undefined &&
          person.person_family_id !== undefined &&
          person.person_spm_unit_id !== undefined &&
          person.person_marital_unit_id !== undefined &&
          person.person_household_id !== undefined;

        if (!hasAllUSRefs) {
          const missing: string[] = [];
          if (person.person_tax_unit_id === undefined) missing.push('tax_unit');
          if (person.person_family_id === undefined) missing.push('family');
          if (person.person_spm_unit_id === undefined) missing.push('spm_unit');
          if (person.person_marital_unit_id === undefined) missing.push('marital_unit');
          if (person.person_household_id === undefined) missing.push('household');

          warnings.push({
            code: 'INCOMPLETE_US_ENTITY_REFS',
            message: `${personLabel} missing entity references: ${missing.join(', ')}`,
            field: `people[${person.person_id}]`,
          });
        }
      }

      // For UK households, check required entity references
      if (HouseholdQueries.isUKHousehold(household)) {
        const hasAllUKRefs =
          person.person_benunit_id !== undefined && person.person_household_id !== undefined;

        if (!hasAllUKRefs) {
          const missing: string[] = [];
          if (person.person_benunit_id === undefined) missing.push('benunit');
          if (person.person_household_id === undefined) missing.push('household');

          warnings.push({
            code: 'INCOMPLETE_UK_ENTITY_REFS',
            message: `${personLabel} missing entity references: ${missing.join(', ')}`,
            field: `people[${person.person_id}]`,
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Get variable metadata from Redux state
   */
  getVariableMetadata(state: RootState, name: string): VariableMetadata | undefined {
    const variables = state.metadata?.variables;
    if (!variables) {
      return undefined;
    }

    return variables[name];
  },
};

// ============================================================================
// Standalone Validation Functions
// ============================================================================

/**
 * Quick check if household has minimum required structure
 */
export function hasMinimumStructure(household: Household): boolean {
  return (
    !!household.tax_benefit_model_name &&
    !!household.year &&
    Array.isArray(household.people) &&
    household.people.length > 0
  );
}

/**
 * Check if all people have required entity assignments for US
 */
export function hasCompleteUSEntityAssignments(household: Household): boolean {
  if (!HouseholdQueries.isUSHousehold(household)) return true;

  return household.people.every(
    (p) =>
      p.person_tax_unit_id !== undefined &&
      p.person_family_id !== undefined &&
      p.person_spm_unit_id !== undefined &&
      p.person_marital_unit_id !== undefined &&
      p.person_household_id !== undefined
  );
}

/**
 * Check if all people have required entity assignments for UK
 */
export function hasCompleteUKEntityAssignments(household: Household): boolean {
  if (!HouseholdQueries.isUKHousehold(household)) return true;

  return household.people.every(
    (p) => p.person_benunit_id !== undefined && p.person_household_id !== undefined
  );
}

/**
 * Get list of people missing entity assignments
 */
export function getPeopleMissingEntityAssignments(household: Household): HouseholdPerson[] {
  if (HouseholdQueries.isUSHousehold(household)) {
    return household.people.filter(
      (p) =>
        p.person_tax_unit_id === undefined ||
        p.person_family_id === undefined ||
        p.person_spm_unit_id === undefined ||
        p.person_marital_unit_id === undefined ||
        p.person_household_id === undefined
    );
  }

  if (HouseholdQueries.isUKHousehold(household)) {
    return household.people.filter(
      (p) => p.person_benunit_id === undefined || p.person_household_id === undefined
    );
  }

  return [];
}
