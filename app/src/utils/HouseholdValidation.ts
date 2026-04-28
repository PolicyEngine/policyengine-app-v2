import { type CountryId } from '@/libs/countries';
import type { Household as HouseholdModel } from '@/models/Household';
import type {
  AppHouseholdInputData,
  AppHouseholdInputGroup as HouseholdGroupEntity,
} from '@/models/household/appTypes';
import { getV2GroupDefinitions } from '@/models/household/schema';
import { RootState } from '@/store';
import { getHouseholdGroupCollection, getHouseholdYearValue } from '@/utils/householdDataAccess';

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
 * Variable metadata structure based on the provided format
 */
export interface VariableMetadata {
  entity: string; // Could be any entity type, not limited to specific ones
  valueType: 'float' | 'int' | 'bool' | 'string';
  definitionPeriod: 'year' | 'month' | 'day' | 'eternity';
  name: string;
  label: string;
  unit?: string;
  isInputVariable: boolean;
  defaultValue: any;
}

type CountryValidationStrategy = (
  household: HouseholdModel,
  errors: ValidationError[],
  warnings: ValidationWarning[]
) => void;

function isHouseholdModel(household: HouseholdModel): boolean {
  return (
    typeof household.getGroupCollection === 'function' &&
    typeof household.getAllGroupCollections === 'function'
  );
}

function getValidationPersonNames(household: HouseholdModel): string[] {
  if (isHouseholdModel(household)) {
    return household.personNames;
  }

  return Object.keys(household.householdData?.people ?? {});
}

function getValidationPersonYearValue(
  household: HouseholdModel,
  personName: string,
  variableName: string,
  year: string
) {
  if (isHouseholdModel(household)) {
    return household.getPersonVariableAtYear(personName, variableName, year);
  }

  return getHouseholdYearValue(household.householdData?.people?.[personName]?.[variableName], year);
}

function getValidationGroupCollection(
  household: HouseholdModel,
  entityName: string
): Record<string, HouseholdGroupEntity> | undefined {
  if (isHouseholdModel(household)) {
    return household.getGroupCollection(entityName) as
      | Record<string, HouseholdGroupEntity>
      | undefined;
  }

  return getHouseholdGroupCollection(
    household.householdData as AppHouseholdInputData,
    entityName
  ) as Record<string, HouseholdGroupEntity> | undefined;
}

function getValidationGroupCollections(
  household: HouseholdModel
): Array<{ entityName: string; groups: Record<string, HouseholdGroupEntity> }> {
  if (isHouseholdModel(household)) {
    return household.getAllGroupCollections().map(({ entityName, groups }) => ({
      entityName,
      groups: groups as Record<string, HouseholdGroupEntity>,
    }));
  }

  const householdData = household.householdData as AppHouseholdInputData;
  return [
    ['households', householdData.households],
    ['families', householdData.families],
    ['taxUnits', householdData.taxUnits],
    ['spmUnits', householdData.spmUnits],
    ['maritalUnits', householdData.maritalUnits],
    ['benunits', householdData.benunits],
  ]
    .filter((entry): entry is [string, Record<string, HouseholdGroupEntity>] => Boolean(entry[1]))
    .map(([entityName, groups]) => ({ entityName, groups }));
}

function getConfiguredGroupCollections(
  household: HouseholdModel,
  countryId: CountryId
): Array<{ entityName: string; groups: Record<string, HouseholdGroupEntity> }> {
  if (countryId === 'us' || countryId === 'uk') {
    const configuredCollections: Array<{
      entityName: string;
      groups: Record<string, HouseholdGroupEntity>;
    }> = [];

    for (const definition of getV2GroupDefinitions(countryId)) {
      const groups = getValidationGroupCollection(household, definition.appKey);

      if (!groups) {
        continue;
      }

      configuredCollections.push({
        entityName: definition.appKey,
        groups,
      });
    }

    return configuredCollections;
  }

  return getValidationGroupCollections(household);
}

function getUnexpectedGroupCollections(household: HouseholdModel, countryId: CountryId): string[] {
  if (countryId !== 'us' && countryId !== 'uk') {
    return [];
  }

  const allowedEntityNames = new Set<string>(
    getV2GroupDefinitions(countryId).map((definition) => definition.appKey)
  );

  return getValidationGroupCollections(household)
    .map(({ entityName }) => entityName)
    .filter((entityName) => !allowedEntityNames.has(entityName));
}

const COUNTRY_VALIDATION_STRATEGIES: Partial<Record<CountryId, CountryValidationStrategy>> = {
  us: (household, errors, warnings) =>
    HouseholdValidation.validateUSHousehold(household, errors, warnings),
  uk: (household, errors) => HouseholdValidation.validateUKHousehold(household, errors),
};

/**
 * Validation utilities for Household structures
 * Generic structural validation with country-specific strategy extensions
 * TODO: Determine how many of these utils we need; were unexpectedly built by AI,
 * but could be useful down the road; not thoroughly tested
 */
export const HouseholdValidation = {
  /**
   * Validate a household for a specific country
   * @param year - Year to validate against (required - should come from report context)
   */
  validateForCountry(
    household: HouseholdModel,
    countryId: CountryId,
    year: string
  ): ValidationResult {
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
    this.validateGenericHousehold(household, errors, warnings, year, countryId);

    const strategy = COUNTRY_VALIDATION_STRATEGIES[countryId];
    strategy?.(household, errors, warnings);

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
    household: HouseholdModel,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    year: string,
    countryId: CountryId = household.countryId
  ): void {
    // Check that all people have required fields based on metadata
    const currentYear = year;

    getValidationPersonNames(household).forEach((personId) => {
      // Only validate age if it's expected to exist (this would come from metadata)
      if (getValidationPersonYearValue(household, personId, 'age', currentYear) === undefined) {
        warnings.push({
          code: 'MISSING_AGE',
          message: `Person ${personId} is missing age for year ${currentYear}`,
          field: `people.${personId}.age`,
        });
      }
    });

    getUnexpectedGroupCollections(household, countryId).forEach((entityName) => {
      warnings.push({
        code: 'UNEXPECTED_GROUP_COLLECTION',
        message: `Group collection ${entityName} is not used for ${countryId.toUpperCase()} households`,
        field: entityName,
      });
    });

    // Check that country-configured group entities have valid structure.
    // For supported country-specific household models, this uses the same
    // country schema layer as the V2 codecs. Other countries fall back to
    // validating whatever concrete group collections are present.
    getConfiguredGroupCollections(household, countryId).forEach(({ entityName, groups }) => {
      Object.entries(groups).forEach(([groupKey, group]) => {
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
    household: HouseholdModel,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for US-specific entities if they exist
    if (household.householdData.taxUnits) {
      const taxUnits = household.householdData.taxUnits as Record<string, HouseholdGroupEntity>;

      // Must have at least one tax unit if there are people
      if (household.personCount > 0 && Object.keys(taxUnits).length === 0) {
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
  validateUKHousehold(household: HouseholdModel, errors: ValidationError[]): void {
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
  isReadyForSimulation(
    household: HouseholdModel,
    countryId: CountryId,
    year: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Must have at least one person
    if (household.personCount === 0) {
      errors.push({
        code: 'NO_PEOPLE',
        message: 'Household must have at least one person for simulation',
        field: 'people',
      });
    }

    // Validate structure
    const structureValidation = this.validateForCountry(household, countryId, year);
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

    return {
      entity: variable.entity,
      valueType: variable.valueType as any,
      definitionPeriod: variable.definitionPeriod as any,
      name: variable.name,
      label: variable.label,
      unit: variable.unit,
      isInputVariable: variable.isInputVariable,
      defaultValue: variable.defaultValue,
    };
  },
};
