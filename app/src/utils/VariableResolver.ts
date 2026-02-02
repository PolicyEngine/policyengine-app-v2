/**
 * VariableResolver - Entity-aware utility for reading/writing household variables
 *
 * Resolves which entity a variable belongs to using metadata, and provides
 * getters/setters that access the correct location in household data.
 *
 * Works with the v2 Alpha format (single-dict entities, index-based people).
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
  dataType?: string; // "float", "int", "bool", "Enum" - from V2 API data_type
  defaultValue: any;
  possibleValues?: string[] | Record<string, string> | null;
  description?: string;
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
    dataType: variable.data_type,
    defaultValue: variable.defaultValue,
    possibleValues: variable.possible_values,
    description: variable.description,
  };
}

/**
 * Map entity plural name to the Household field key
 */
function pluralToHouseholdKey(plural: string): string {
  const map: Record<string, string> = {
    people: 'person',
    tax_units: 'tax_unit',
    families: 'family',
    spm_units: 'spm_unit',
    marital_units: 'marital_unit',
    households: 'household',
    benunits: 'benunit',
  };
  return map[plural] ?? 'person';
}

/**
 * Get value for a variable from the correct entity location
 *
 * @param household - The household data (v2 format)
 * @param variableName - Name of the variable (snake_case)
 * @param metadata - Country metadata
 * @param entityIndex - For person variables: array index. For entities: ignored (single dict).
 */
export function getValue(
  household: Household,
  variableName: string,
  metadata: any,
  entityIndex?: number
): any {
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    console.warn(`[VariableResolver] Unknown variable: ${variableName}`);
    return null;
  }

  if (entityInfo.isPerson) {
    const index = entityIndex ?? 0;
    return household.people[index]?.[variableName] ?? null;
  }

  // For group entities, access the single dict directly
  const entityKey = pluralToHouseholdKey(entityInfo.plural);
  const entity = household[entityKey as keyof Household] as Record<string, any> | undefined;
  return entity?.[variableName] ?? null;
}

/**
 * Set value for a variable at the correct entity location
 * Returns a new household object (immutable update)
 *
 * @param household - The household data (v2 format)
 * @param variableName - Name of the variable (snake_case)
 * @param value - Value to set
 * @param metadata - Country metadata
 * @param entityIndex - For person variables: array index. For entities: ignored.
 */
export function setValue(
  household: Household,
  variableName: string,
  value: any,
  metadata: any,
  entityIndex?: number
): Household {
  const entityInfo = resolveEntity(variableName, metadata);
  if (!entityInfo) {
    console.warn(`[VariableResolver] Unknown variable: ${variableName}`);
    return household;
  }

  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;

  if (entityInfo.isPerson) {
    const index = entityIndex ?? 0;
    if (newHousehold.people[index]) {
      newHousehold.people[index][variableName] = value;
    }
    return newHousehold;
  }

  // For group entities, set on the single dict
  const entityKey = pluralToHouseholdKey(entityInfo.plural) as keyof Household;
  const entity = newHousehold[entityKey] as Record<string, any> | undefined;
  if (entity) {
    entity[variableName] = value;
  }

  return newHousehold;
}

/**
 * Add a variable to all applicable entity instances with default value
 */
export function addVariable(household: Household, variableName: string, metadata: any): Household {
  const entityInfo = resolveEntity(variableName, metadata);
  const variableInfo = getVariableInfo(variableName, metadata);

  if (!entityInfo || !variableInfo) {
    return household;
  }

  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;

  if (entityInfo.isPerson) {
    for (const person of newHousehold.people) {
      if (person[variableName] === undefined) {
        person[variableName] = variableInfo.defaultValue;
      }
    }
  } else {
    // Set on the single entity dict
    const entityKey = pluralToHouseholdKey(entityInfo.plural) as keyof Household;
    const entity = newHousehold[entityKey] as Record<string, any> | undefined;
    if (entity && entity[variableName] === undefined) {
      entity[variableName] = variableInfo.defaultValue;
    }
  }

  return newHousehold;
}

/**
 * Add a variable to a single specific entity instance with default value
 */
export function addVariableToEntity(
  household: Household,
  variableName: string,
  metadata: any,
  entityIndex?: number
): Household {
  const entityInfo = resolveEntity(variableName, metadata);
  const variableInfo = getVariableInfo(variableName, metadata);

  if (!entityInfo || !variableInfo) {
    return household;
  }

  const newHousehold = JSON.parse(JSON.stringify(household)) as Household;

  if (entityInfo.isPerson) {
    const index = entityIndex ?? 0;
    const person = newHousehold.people[index];
    if (person && person[variableName] === undefined) {
      person[variableName] = variableInfo.defaultValue;
    }
  } else {
    // Set on the single entity dict
    const entityKey = pluralToHouseholdKey(entityInfo.plural) as keyof Household;
    const entity = newHousehold[entityKey] as Record<string, any> | undefined;
    if (entity && entity[variableName] === undefined) {
      entity[variableName] = variableInfo.defaultValue;
    }
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

  if (entityInfo.isPerson) {
    for (const person of newHousehold.people) {
      delete person[variableName];
    }
  } else {
    // Delete from the single entity dict
    const entityKey = pluralToHouseholdKey(entityInfo.plural) as keyof Household;
    const entity = newHousehold[entityKey] as Record<string, any> | undefined;
    if (entity) {
      delete entity[variableName];
    }
  }

  return newHousehold;
}

/**
 * Get all variables from metadata
 */
export function getInputVariables(metadata: any): VariableInfo[] {
  if (!metadata.variables) {
    return [];
  }

  return Object.values(metadata.variables).map((v: any) => ({
    name: v.name,
    label: v.label,
    entity: v.entity,
    dataType: v.data_type,
    defaultValue: v.defaultValue,
    possibleValues: v.possible_values,
    description: v.description,
  }));
}

/**
 * Get the group instance name for an entity type
 * Maps entity plural to the display name
 */
export function getGroupName(entityPlural: string): string {
  const groupNameMap: Record<string, string> = {
    people: 'you',
    households: 'your household',
    tax_units: 'your tax unit',
    spm_units: 'your household',
    families: 'your family',
    marital_units: 'your marital unit',
    benunits: 'your benefit unit',
  };

  return groupNameMap[entityPlural] || entityPlural;
}
