import { RootState } from '@/store';
import { Household, HouseholdGroupEntity } from '@/types/ingredients/Household';
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
 * Country-agnostic base validation with country-specific extensions
 * TODO: Determine how many of these utils we need; were unexpectedly built by AI,
 * but could be useful down the road; not thoroughly tested
 */
export const HouseholdValidation = {
  /**
   * Validate a household for a specific country
   * @param year - Year to validate against (required - should come from report context)
   */
  validateForCountry(household: Household, countryId: string, year: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if country matches
    if (household.countryId !== countryId) {
      errors.push({
        code: 'COUNTRY_MISMATCH',
        message: `Household country ${household.countryId} does not match expected ${countryId}`,
        field: 'countryId',
      });
    }

    // Generic validation with report year
    this.validateGenericHousehold(household, errors, warnings, year);

    // Country-specific validation
    switch (countryId) {
      case 'us':
        this.validateUSHousehold(household, errors, warnings);
        break;
      case 'uk':
        this.validateUKHousehold(household, errors);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Generic household validation applicable to all countries
   * @param year - Year to validate against (required - should come from report context)
   */
  validateGenericHousehold(
    household: Household,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    year: string
  ): void {
    // Check that all people have required fields based on metadata
    const currentYear = year;

    Object.entries(household.householdData.people).forEach(([personId, person]) => {
      // Only validate age if it's expected to exist (this would come from metadata)
      if (!person.age || !(currentYear in person.age)) {
        warnings.push({
          code: 'MISSING_AGE',
          message: `Person ${personId} is missing age for year ${currentYear}`,
          field: `people.${personId}.age`,
        });
      }
    });

    // Check that group entities have valid structure
    Object.entries(household.householdData).forEach(([entityName, entityData]) => {
      if (entityName === 'people') {
        return;
      }

      const entities = entityData as Record<string, HouseholdGroupEntity>;
      Object.entries(entities).forEach(([groupKey, group]) => {
        if (!Array.isArray(group.members)) {
          errors.push({
            code: 'INVALID_GROUP_STRUCTURE',
            message: `Group ${groupKey} in ${entityName} must have a members array`,
            field: `${entityName}.${groupKey}.members`,
          });
        }
      });
    });
  },

  /**
   * US-specific validation
   */
  validateUSHousehold(
    household: Household,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for US-specific entities if they exist
    if (household.householdData.taxUnits) {
      const taxUnits = household.householdData.taxUnits as Record<string, HouseholdGroupEntity>;

      // Must have at least one tax unit if there are people
      if (HouseholdQueries.getPersonCount(household) > 0 && Object.keys(taxUnits).length === 0) {
        warnings.push({
          code: 'NO_TAX_UNITS',
          message: 'US households with people typically have at least one tax unit',
          field: 'taxUnits',
        });
      }

      // Check that all people are in a tax unit
      const allPeople = Object.keys(household.householdData.people);
      const peopleInTaxUnits = new Set(Object.values(taxUnits).flatMap((unit) => unit.members));

      allPeople.forEach((personId) => {
        if (!peopleInTaxUnits.has(personId)) {
          warnings.push({
            code: 'PERSON_NOT_IN_TAX_UNIT',
            message: `Person ${personId} is not assigned to any tax unit`,
            field: `people.${personId}`,
          });
        }
      });
    }

    // Validate marital units if they exist
    // Marital units can have 1 member (single) or 2 members (married couple)
    if (household.householdData.maritalUnits) {
      const maritalUnits = household.householdData.maritalUnits as Record<
        string,
        HouseholdGroupEntity
      >;
      Object.entries(maritalUnits).forEach(([unitId, unit]) => {
        if (unit.members.length === 0 || unit.members.length > 2) {
          errors.push({
            code: 'INVALID_MARITAL_UNIT',
            message: `Marital unit ${unitId} must have 1 or 2 members`,
            field: `maritalUnits.${unitId}`,
          });
        }
      });
    }
  },

  /**
   * UK-specific validation
   */
  validateUKHousehold(household: Household, errors: ValidationError[]): void {
    // Check for UK-specific entities if they exist
    if (household.householdData.benunits) {
      const benunits = household.householdData.benunits as Record<string, HouseholdGroupEntity>;

      // UK-specific validation rules for benefit units
      Object.entries(benunits).forEach(([unitId, unit]) => {
        if (!unit.members || unit.members.length === 0) {
          errors.push({
            code: 'EMPTY_BENUNIT',
            message: `Benefit unit ${unitId} has no members`,
            field: `benunits.${unitId}`,
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

    // Check if the entity type exists or can be created
    // All entity types are allowed in the flexible structure
    return true;
  },

  /**
   * Validate a variable value
   */
  validateVariableValue(value: any, metadata: VariableMetadata): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type checking
    switch (metadata.valueType) {
      case 'float':
      case 'int':
        if (typeof value !== 'number') {
          errors.push({
            code: 'INVALID_TYPE',
            message: `Variable ${metadata.name} must be a number`,
            field: metadata.name,
          });
        }
        if (metadata.valueType === 'int' && !Number.isInteger(value)) {
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
   * @param year - Year to validate against (required - should come from report context)
   */
  isReadyForSimulation(household: Household, year: string): ValidationResult {
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

    // Validate structure
    const structureValidation = this.validateForCountry(household, household.countryId, year);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Get variable metadata from Redux state
   * This is a helper that would need access to the Redux store
   */
  getVariableMetadata(state: RootState, name: string): VariableMetadata | undefined {
    // Access metadata from Redux state
    // This assumes metadata is stored in state.metadata.variables or similar
    const variables = state.metadata?.variables;
    if (!variables) {
      return undefined;
    }

    const variable = variables[name];
    if (!variable) {
      return undefined;
    }

    // Return the variable directly - it's already typed as VariableMetadata
    return variable;
  },
};
