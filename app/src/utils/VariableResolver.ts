/**
 * VariableResolver - Entity-aware utility for reading/writing household variables
 *
 * Resolves which entity a variable belongs to using metadata, and provides
 * getters/setters that access the correct location in household data.
 */

import { Household as HouseholdModel } from '@/models/Household';
import { cloneAppHouseholdInputData } from '@/models/household/appCodec';
import type { AppHouseholdInputData } from '@/models/household/appTypes';
import {
  ensureHouseholdGroupCollection,
  ensureHouseholdGroupInstance,
  getHouseholdGroupCollection,
  getPreferredHouseholdGroupName,
  isHouseholdYearMap,
} from './householdDataAccess';
import { getNormalizedVariableMetadata } from './variableMetadata';

function cloneHouseholdData(household: HouseholdModel): AppHouseholdInputData {
  return cloneAppHouseholdInputData(household.householdData);
}

function withHouseholdData(
  household: HouseholdModel,
  householdData: AppHouseholdInputData
): HouseholdModel {
  return HouseholdModel.fromDraft({
    id: household.id,
    countryId: household.countryId,
    label: household.label,
    year: household.year,
    householdData,
  });
}

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

/**
 * Get the entity data object from household based on plural name
 */
function getEntityData(
  householdData: AppHouseholdInputData,
  entityPlural: string
): Record<string, any> | null {
  if (entityPlural === 'people') {
    return householdData.people;
  }

  return getHouseholdGroupCollection(householdData, entityPlural) ?? null;
}

function ensureEntityData(
  householdData: AppHouseholdInputData,
  entityPlural: string
): Record<string, any> | null {
  if (entityPlural === 'people') {
    return householdData.people;
  }

  return ensureHouseholdGroupCollection(householdData, entityPlural);
}

function resolveEntityInstanceName(
  householdData: AppHouseholdInputData,
  entityInfo: EntityInfo,
  entityName?: string
): string | null {
  if (entityName) {
    return entityName;
  }

  if (entityInfo.isPerson) {
    console.warn(`[VariableResolver] Person-level variable requires entityName`);
    return null;
  }

  const resolvedName = getPreferredHouseholdGroupName(householdData, entityInfo.plural);
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
  const householdData = household.householdData;
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    console.warn(`[VariableResolver] Unknown variable: ${variableName}`);
    return null;
  }

  const entityData = getEntityData(householdData, entityInfo.plural);
  if (!entityData) {
    return null;
  }

  const instanceName = resolveEntityInstanceName(householdData, entityInfo, entityName);
  if (!instanceName) {
    return null;
  }

  const instance = entityData[instanceName];
  if (!instance) {
    return null;
  }

  const variableData = instance[variableName];
  if (!variableData) {
    return null;
  }

  if (!isHouseholdYearMap(variableData)) {
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

  // Deep clone to maintain immutability
  const newHouseholdData = cloneHouseholdData(household);
  const entityData = ensureEntityData(newHouseholdData, entityInfo.plural);

  if (!entityData) {
    console.warn(`[VariableResolver] Entity ${entityInfo.plural} not found in household`);
    return household;
  }

  const instanceName = resolveEntityInstanceName(newHouseholdData, entityInfo, entityName);
  if (!instanceName) {
    return household;
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

  return withHouseholdData(household, newHouseholdData);
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

  const newHouseholdData = cloneHouseholdData(household);
  const entityData = ensureEntityData(newHouseholdData, entityInfo.plural);

  if (!entityData) {
    return household;
  }

  const instanceNames = Object.keys(entityData);
  if (instanceNames.length === 0) {
    const instanceName = entityInfo.isPerson
      ? resolveEntityInstanceName(newHouseholdData, entityInfo)
      : ensureHouseholdGroupInstance(newHouseholdData, entityInfo.plural);
    if (!instanceName) {
      return household;
    }
    if (!entityData[instanceName]) {
      entityData[instanceName] = entityInfo.isPerson ? {} : { members: [] };
    }
    instanceNames.push(instanceName);
  }

  // Add variable to all instances of this entity type
  for (const instanceName of instanceNames) {
    if (!entityData[instanceName][variableName]) {
      entityData[instanceName][variableName] = {
        [year]: variableInfo.defaultValue,
      };
    }
  }

  return withHouseholdData(household, newHouseholdData);
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

  const newHouseholdData = cloneHouseholdData(household);
  const entityData = ensureEntityData(newHouseholdData, entityInfo.plural);

  if (!entityData) {
    return household;
  }

  const resolvedEntityName =
    entityName && entityData[entityName]
      ? entityName
      : entityInfo.isPerson
        ? resolveEntityInstanceName(newHouseholdData, entityInfo, entityName)
        : ensureHouseholdGroupInstance(newHouseholdData, entityInfo.plural);
  if (!resolvedEntityName) {
    return household;
  }

  // Add variable only to the specified entity instance
  if (!entityData[resolvedEntityName]) {
    entityData[resolvedEntityName] = entityInfo.isPerson ? {} : { members: [] };
  }

  if (!entityData[resolvedEntityName][variableName]) {
    entityData[resolvedEntityName][variableName] = {
      [year]: variableInfo.defaultValue,
    };
  }

  return withHouseholdData(household, newHouseholdData);
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

  const newHouseholdData = cloneHouseholdData(household);
  const entityData = getEntityData(newHouseholdData, entityInfo.plural);

  if (!entityData) {
    return household;
  }

  // Remove variable from all instances
  for (const instanceName of Object.keys(entityData)) {
    delete entityData[instanceName][variableName];
  }

  return withHouseholdData(household, newHouseholdData);
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

  const newHouseholdData = cloneHouseholdData(household);
  const entityData = getEntityData(newHouseholdData, entityInfo.plural);

  if (!entityData || !entityData[entityName]) {
    return household;
  }

  delete entityData[entityName][variableName];

  return withHouseholdData(household, newHouseholdData);
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
