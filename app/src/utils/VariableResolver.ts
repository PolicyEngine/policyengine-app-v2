/**
 * VariableResolver - Entity-aware utility for reading/writing household variables
 *
 * Resolves which entity a variable belongs to using metadata, and provides
 * getters/setters that access the correct location in household data.
 */

import { Household as HouseholdModel } from '@/models/Household';
import { getNormalizedVariableMetadata } from './variableMetadata';

export interface EntityInfo {
  entity: string; // e.g., "person", "tax_unit", "spm_unit"
  plural: string; // e.g., "people", "tax_units", "spm_units"
  label: string; // e.g., "Person", "Tax Unit", "SPM Unit"
  isPerson: boolean;
}

export interface VariableInfo {
  name: string;
  label: string;
  entity: string;
  valueType: string; // "float", "int", "bool", "Enum"
  unit?: string;
  defaultValue: any;
  isInputVariable: boolean;
  hiddenInput: boolean;
  moduleName: string;
  possibleValues?: Array<{ value: string; label: string }>;
  documentation?: string;
}

/**
 * Get entity information for a variable
 */
export function resolveEntity(variableName: string, metadata: any): EntityInfo | null {
  const variable = metadata.variables?.[variableName];
  if (!variable) {
    return null;
  }

  const entityType = variable.entity;
  const entityInfo = metadata.entities?.[entityType];
  if (!entityInfo) {
    return null;
  }

  return {
    entity: entityType,
    plural: entityInfo.plural,
    label: entityInfo.label,
    isPerson: entityInfo.is_person || entityType === 'person',
  };
}

/**
 * Get simplified entity display info for a variable
 * Returns isPerson flag and a display label for the entity type
 */
export function getVariableEntityDisplayInfo(
  variableName: string,
  metadata: any
): { isPerson: boolean; label: string } {
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    return { isPerson: true, label: 'unknown' };
  }
  return {
    isPerson: entityInfo.isPerson,
    label: entityInfo.isPerson ? 'person' : entityInfo.label?.toLowerCase() || 'household',
  };
}

/**
 * Get variable metadata
 */
export function getVariableInfo(variableName: string, metadata: any): VariableInfo | null {
  const variable = metadata.variables?.[variableName];
  if (!variable) {
    return null;
  }

  const normalizedVariable = getNormalizedVariableMetadata(variable);

  return {
    name: normalizedVariable.name,
    label: normalizedVariable.label,
    entity: normalizedVariable.entity,
    valueType: normalizedVariable.valueType,
    unit: normalizedVariable.unit,
    defaultValue: normalizedVariable.defaultValue,
    isInputVariable: normalizedVariable.isInputVariable,
    hiddenInput: normalizedVariable.hiddenInput,
    moduleName: normalizedVariable.moduleName,
    possibleValues: normalizedVariable.possibleValues,
    documentation: normalizedVariable.documentation,
  };
}

function resolveEntityInstanceName(
  household: HouseholdModel,
  entityInfo: EntityInfo,
  entityName?: string
): string | null {
  if (!entityInfo.isPerson && !household.isConfiguredGroupEntity(entityInfo.plural)) {
    console.warn(
      `[VariableResolver] Entity ${entityInfo.plural} is not configured for ${household.countryId} households`
    );
    return null;
  }

  if (entityName) {
    return entityName;
  }

  if (entityInfo.isPerson) {
    console.warn(`[VariableResolver] Person-level variable requires entityName`);
    return null;
  }

  const resolvedName = household.getPreferredGroupName(entityInfo.plural);
  if (!resolvedName) {
    console.warn(`[VariableResolver] Entity ${entityInfo.plural} not found in household`);
    return null;
  }

  return resolvedName;
}

/**
 * Get value for a variable from the correct entity location
 *
 * @param household - The household data
 * @param variableName - Name of the variable (snake_case)
 * @param metadata - Country metadata
 * @param year - Tax year
 * @param entityName - Specific entity instance name (e.g., "you", "your partner")
 *                     Required for person-level variables, optional for others
 */
export function getValue(
  household: HouseholdModel,
  variableName: string,
  metadata: any,
  year: string,
  entityName?: string
): any {
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    console.warn(`[VariableResolver] Unknown variable: ${variableName}`);
    return null;
  }

  const entityType = entityInfo.isPerson ? 'people' : entityInfo.plural;
  const instanceName = resolveEntityInstanceName(household, entityInfo, entityName);
  if (!instanceName) {
    return null;
  }

  return household.getEntityVariableAtYear(entityType, instanceName, variableName, year) ?? null;
}

/**
 * Set value for a variable at the correct entity location
 * Returns a new household object (immutable update)
 *
 * @param household - The household data
 * @param variableName - Name of the variable (snake_case)
 * @param value - Value to set
 * @param metadata - Country metadata
 * @param year - Tax year
 * @param entityName - Specific entity instance name (required for person-level)
 */
export function setValue(
  household: HouseholdModel,
  variableName: string,
  value: any,
  metadata: any,
  year: string,
  entityName?: string
): HouseholdModel {
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    console.warn(`[VariableResolver] Unknown variable: ${variableName}`);
    return household;
  }

  const entityType = entityInfo.isPerson ? 'people' : entityInfo.plural;
  const instanceName = resolveEntityInstanceName(household, entityInfo, entityName);
  if (!instanceName) {
    return household;
  }

  if (!household.hasEntityInstance(entityType, instanceName)) {
    console.warn(`[VariableResolver] Entity instance ${instanceName} not found`);
    return household;
  }

  return household.setEntityVariableAtYear(entityType, instanceName, variableName, year, value);
}

/**
 * Add a variable to all applicable entity instances with default value
 * Note: Currently unused. Kept for potential future use if we add "Add variable to all members" functionality
 */
export function addVariable(
  household: HouseholdModel,
  variableName: string,
  metadata: any,
  year: string
): HouseholdModel {
  const entityInfo = resolveEntity(variableName, metadata);
  const variableInfo = getVariableInfo(variableName, metadata);

  if (!entityInfo || !variableInfo) {
    return household;
  }

  if (!entityInfo.isPerson && !household.isConfiguredGroupEntity(entityInfo.plural)) {
    return household;
  }

  const entityType = entityInfo.isPerson ? 'people' : entityInfo.plural;
  let nextHousehold = household;
  const instanceNames = nextHousehold.getEntityInstanceNames(entityType);
  if (instanceNames.length === 0) {
    if (entityInfo.isPerson) {
      return household;
    }

    const ensured = nextHousehold.ensureGroupInstance(entityInfo.plural);
    nextHousehold = ensured.household;
    instanceNames.push(ensured.groupKey);
  }

  for (const instanceName of instanceNames) {
    nextHousehold = nextHousehold.addEntityVariableIfMissingAtYear(
      entityType,
      instanceName,
      variableName,
      year,
      variableInfo.defaultValue
    );
  }

  return nextHousehold;
}

/**
 * Add a variable to a single specific entity instance with default value
 * Use this for per-person variable assignment
 */
export function addVariableToEntity(
  household: HouseholdModel,
  variableName: string,
  metadata: any,
  year: string,
  entityName?: string
): HouseholdModel {
  const entityInfo = resolveEntity(variableName, metadata);
  const variableInfo = getVariableInfo(variableName, metadata);

  if (!entityInfo || !variableInfo) {
    return household;
  }

  if (!entityInfo.isPerson && !household.isConfiguredGroupEntity(entityInfo.plural)) {
    return household;
  }

  const entityType = entityInfo.isPerson ? 'people' : entityInfo.plural;
  let nextHousehold = household;
  const resolvedEntityName =
    entityName && nextHousehold.hasEntityInstance(entityType, entityName)
      ? entityName
      : entityInfo.isPerson
        ? resolveEntityInstanceName(nextHousehold, entityInfo, entityName)
        : (() => {
            const ensured = nextHousehold.ensureGroupInstance(entityInfo.plural);
            nextHousehold = ensured.household;
            return ensured.groupKey;
          })();
  if (!resolvedEntityName) {
    return household;
  }

  return nextHousehold.addEntityVariableIfMissingAtYear(
    entityType,
    resolvedEntityName,
    variableName,
    year,
    variableInfo.defaultValue
  );
}

/**
 * Remove a variable from all entity instances
 */
export function removeVariable(
  household: HouseholdModel,
  variableName: string,
  metadata: any
): HouseholdModel {
  const entityInfo = resolveEntity(variableName, metadata);

  if (!entityInfo) {
    return household;
  }

  if (!entityInfo.isPerson && !household.isConfiguredGroupEntity(entityInfo.plural)) {
    return household;
  }

  const entityType = entityInfo.isPerson ? 'people' : entityInfo.plural;
  let nextHousehold = household;

  for (const instanceName of nextHousehold.getEntityInstanceNames(entityType)) {
    nextHousehold = nextHousehold.removeEntityVariable(entityType, instanceName, variableName);
  }

  return nextHousehold;
}

/**
 * Remove a variable from a single specific entity instance.
 * Used for per-person variable removal in the household builder.
 */
export function removeVariableFromEntity(
  household: HouseholdModel,
  variableName: string,
  metadata: any,
  entityName: string
): HouseholdModel {
  const entityInfo = resolveEntity(variableName, metadata);

  if (!entityInfo) {
    return household;
  }

  if (!entityInfo.isPerson && !household.isConfiguredGroupEntity(entityInfo.plural)) {
    return household;
  }

  const entityType = entityInfo.isPerson ? 'people' : entityInfo.plural;
  if (!household.hasEntityInstance(entityType, entityName)) {
    return household;
  }

  return household.removeEntityVariable(entityType, entityName, variableName);
}

/**
 * Get all input variables from metadata (excluding hidden and computed)
 */
export function getInputVariables(metadata: any): VariableInfo[] {
  if (!metadata.variables) {
    return [];
  }

  return Object.values(metadata.variables)
    .map((v: any) => getNormalizedVariableMetadata(v))
    .filter((v: any) => v.isInputVariable && !v.hiddenInput);
}
