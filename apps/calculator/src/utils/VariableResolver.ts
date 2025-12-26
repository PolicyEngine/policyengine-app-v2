/**
 * VariableResolver - Entity-aware utility for reading/writing household variables
 *
 * Resolves which entity a variable belongs to using metadata, and provides
 * getters/setters that access the correct location in household data.
 */

import { Household } from '@/types/ingredients/Household';

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

  return {
    name: variable.name,
    label: variable.label,
    entity: variable.entity,
    valueType: variable.valueType,
    unit: variable.unit,
    defaultValue: variable.defaultValue,
    isInputVariable: variable.isInputVariable,
    hiddenInput: variable.hidden_input,
    moduleName: variable.moduleName,
    possibleValues: variable.possibleValues,
    documentation: variable.documentation || variable.description,
  };
}

/**
 * Get the group instance name for an entity type
 * Maps entity plural to the default instance name used in household data
 *
 * NOTE: These names must match the conventions from policyengine-app (the legacy app).
 * In particular, spm_units uses "your household" as the instance name (not "your spm unit"),
 * which is the same key used by the households entity. This is intentional and matches
 * the legacy app's defaultHouseholds.js structure.
 */
export function getGroupName(entityPlural: string, _personName?: string): string {
  const groupNameMap: Record<string, string> = {
    people: 'you', // Will be overridden by personName if provided
    households: 'your household',
    tax_units: 'your tax unit',
    spm_units: 'your household', // Same as households - matches legacy policyengine-app
    families: 'your family',
    marital_units: 'your marital unit',
    benunits: 'your benefit unit',
  };

  return groupNameMap[entityPlural] || entityPlural;
}

/**
 * Get the entity data object from household based on plural name
 */
function getEntityData(household: Household, entityPlural: string): Record<string, any> | null {
  const householdData = household.householdData;

  switch (entityPlural) {
    case 'people':
      return householdData.people;
    case 'households':
      return householdData.households;
    case 'tax_units':
      // Handle both snake_case and camelCase (HouseholdBuilder uses camelCase)
      return householdData.tax_units || householdData.taxUnits;
    case 'spm_units':
      return householdData.spm_units || householdData.spmUnits;
    case 'families':
      return householdData.families;
    case 'marital_units':
      return householdData.marital_units || householdData.maritalUnits;
    case 'benunits':
      return householdData.benunits;
    default:
      return null;
  }
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
  household: Household,
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

  const entityData = getEntityData(household, entityInfo.plural);
  if (!entityData) {
    return null;
  }

  // Determine which entity instance to read from
  let instanceName: string;
  if (entityName) {
    instanceName = entityName;
  } else if (entityInfo.isPerson) {
    // For person-level variables without entityName, return null
    // Caller should iterate over people
    console.warn(`[VariableResolver] Person-level variable ${variableName} requires entityName`);
    return null;
  } else {
    // For non-person entities, use the default instance name
    instanceName = getGroupName(entityInfo.plural);
  }

  const instance = entityData[instanceName];
  if (!instance) {
    return null;
  }

  const variableData = instance[variableName];
  if (!variableData) {
    return null;
  }

  return variableData[year] ?? null;
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
  household: Household,
  variableName: string,
  value: any,
  metadata: any,
  year: string,
  entityName?: string
): Household {
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    console.warn(`[VariableResolver] Unknown variable: ${variableName}`);
    return household;
  }

  // Deep clone to maintain immutability
  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;
  const entityData = getEntityData(newHousehold, entityInfo.plural);

  if (!entityData) {
    console.warn(`[VariableResolver] Entity ${entityInfo.plural} not found in household`);
    return household;
  }

  // Determine which entity instance to write to
  let instanceName: string;
  if (entityName) {
    instanceName = entityName;
  } else if (entityInfo.isPerson) {
    console.warn(`[VariableResolver] Person-level variable ${variableName} requires entityName`);
    return household;
  } else {
    instanceName = getGroupName(entityInfo.plural);
  }

  // Ensure instance exists
  if (!entityData[instanceName]) {
    console.warn(`[VariableResolver] Entity instance ${instanceName} not found`);
    return household;
  }

  // Ensure variable object exists
  if (!entityData[instanceName][variableName]) {
    entityData[instanceName][variableName] = {};
  }

  // Set the value
  entityData[instanceName][variableName][year] = value;

  return newHousehold;
}

/**
 * Add a variable to all applicable entity instances with default value
 * Note: Currently unused. Kept for potential future use if we add "Add variable to all members" functionality
 */
export function addVariable(
  household: Household,
  variableName: string,
  metadata: any,
  year: string
): Household {
  const entityInfo = resolveEntity(variableName, metadata);
  const variableInfo = getVariableInfo(variableName, metadata);

  if (!entityInfo || !variableInfo) {
    return household;
  }

  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;
  const entityData = getEntityData(newHousehold, entityInfo.plural);

  if (!entityData) {
    return household;
  }

  // Add variable to all instances of this entity type
  for (const instanceName of Object.keys(entityData)) {
    if (!entityData[instanceName][variableName]) {
      entityData[instanceName][variableName] = {
        [year]: variableInfo.defaultValue,
      };
    }
  }

  return newHousehold;
}

/**
 * Add a variable to a single specific entity instance with default value
 * Use this for per-person variable assignment
 */
export function addVariableToEntity(
  household: Household,
  variableName: string,
  metadata: any,
  year: string,
  entityName: string
): Household {
  const entityInfo = resolveEntity(variableName, metadata);
  const variableInfo = getVariableInfo(variableName, metadata);

  if (!entityInfo || !variableInfo) {
    return household;
  }

  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;
  const entityData = getEntityData(newHousehold, entityInfo.plural);

  if (!entityData) {
    return household;
  }

  // Add variable only to the specified entity instance
  if (entityData[entityName] && !entityData[entityName][variableName]) {
    entityData[entityName][variableName] = {
      [year]: variableInfo.defaultValue,
    };
  }

  return newHousehold;
}

/**
 * Remove a variable from all entity instances
 */
export function removeVariable(
  household: Household,
  variableName: string,
  metadata: any
): Household {
  const entityInfo = resolveEntity(variableName, metadata);

  if (!entityInfo) {
    return household;
  }

  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;
  const entityData = getEntityData(newHousehold, entityInfo.plural);

  if (!entityData) {
    return household;
  }

  // Remove variable from all instances
  for (const instanceName of Object.keys(entityData)) {
    delete entityData[instanceName][variableName];
  }

  return newHousehold;
}

/**
 * Get all input variables from metadata (excluding hidden and computed)
 */
export function getInputVariables(metadata: any): VariableInfo[] {
  if (!metadata.variables) {
    return [];
  }

  return Object.values(metadata.variables)
    .filter((v: any) => v.isInputVariable && !v.hidden_input)
    .map((v: any) => ({
      name: v.name,
      label: v.label,
      entity: v.entity,
      valueType: v.valueType,
      unit: v.unit,
      defaultValue: v.defaultValue,
      isInputVariable: v.isInputVariable,
      hiddenInput: v.hidden_input,
      moduleName: v.moduleName,
      possibleValues: v.possibleValues,
      documentation: v.documentation || v.description,
    }));
}
