/**
 * HouseholdValidation - Validation utilities for API v2 Alpha household structure
 *
 * Entity groups are single flat dicts (one entity per type).
 * People are plain variable dicts (no person_id, name, or membership fields).
 * The API handles entity-to-person assignment server-side.
 */

import { RootState } from '@/store';
import { Household, TaxBenefitModelName } from '@/types/ingredients/Household';
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
      this.validateUSHousehold(household, warnings);
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

    // Validate each person has reasonable age
    household.people.forEach((person, index) => {
      if (person.age === undefined) {
        warnings.push({
          code: 'MISSING_AGE',
          message: `Person at index ${index} is missing age`,
          field: `people[${index}].age`,
        });
      } else if (person.age < 0 || person.age > 120) {
        warnings.push({
          code: 'UNUSUAL_AGE',
          message: `Person at index ${index} has unusual age: ${person.age}`,
          field: `people[${index}].age`,
        });
      }
    });
  },

  /**
   * US-specific validation
   */
  validateUSHousehold(household: Household, warnings: ValidationWarning[]): void {
    const personCount = HouseholdQueries.getPersonCount(household);

    // Verify entity dicts exist when there are people
    if (personCount > 0) {
      if (!household.tax_unit) {
        warnings.push({
          code: 'NO_TAX_UNIT',
          message: 'US households with people typically have a tax_unit',
          field: 'tax_unit',
        });
      }
      if (!household.household) {
        warnings.push({
          code: 'NO_HOUSEHOLD_UNIT',
          message: 'US households with people typically have a household',
          field: 'household',
        });
      }
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
