/**
 * householdValues - Value extraction utilities for API v2 Alpha household structure
 *
 * These functions extract and format values from the array-based household structure.
 * Values are flat (no year-keying) - year is at the household level.
 */

import type { EntitiesRecord } from '@/data/static';
import { EntityType, Household, HouseholdPerson } from '@/types/ingredients/Household';
import * as HouseholdQueries from './HouseholdQueries';

/**
 * Metadata interface for household value extraction
 * Components should build this by combining Redux metadata.variables with static entities
 */
export interface HouseholdMetadataContext {
  variables: Record<string, any>;
  entities: EntitiesRecord;
}

/**
 * Extracts a value from household data for a specific variable
 * Works with the v2 array-based household structure
 *
 * @param variableName - The name of the variable to extract
 * @param entityId - Specific entity ID, or null to aggregate all entities
 * @param household - The household data structure
 * @param metadata - The metadata containing variable definitions and entities
 * @param valueFromFirstOnly - If true, only returns value from first entity (no aggregation)
 * @returns The extracted value (number or array)
 */
export function getValueFromHousehold(
  variableName: string,
  entityId: number | null,
  household: Household,
  metadata: HouseholdMetadataContext,
  valueFromFirstOnly = false
): number | number[] {
  const variable = metadata.variables[variableName];
  if (!variable) {
    console.warn(`Variable ${variableName} not found in metadata`);
    return 0;
  }

  // Get the entity type (e.g., "person", "household", "tax_unit")
  const entityType = variable.entity as EntityType;

  // Get entities array
  const entities = HouseholdQueries.getEntitiesByType(household, entityType);

  if (entities.length === 0) {
    return 0;
  }

  // If entityId is null, aggregate across all entities
  if (entityId === null) {
    if (entities.length === 1 || valueFromFirstOnly) {
      const firstEntity = entities[0];
      return getVariableValueFromEntity(firstEntity, variableName, entityType);
    }

    // Aggregate across all entities
    let total: number | number[] = 0;
    for (const entity of entities) {
      const entityValue = getVariableValueFromEntity(entity, variableName, entityType);

      if (Array.isArray(entityValue)) {
        if (!Array.isArray(total)) {
          total = Array(entityValue.length).fill(0);
        }
        for (let i = 0; i < entityValue.length; i++) {
          (total as number[])[i] += entityValue[i];
        }
      } else if (Array.isArray(total)) {
        console.warn('Mixed array and scalar values in aggregation');
      } else {
        total += entityValue;
      }
    }
    return total;
  }

  // Get the specific entity by ID
  const idField = getEntityIdField(entityType);
  const entity = entities.find((e) => e[idField] === entityId);

  if (!entity) {
    console.warn(`Entity with ID ${entityId} not found in ${entityType}`);
    return 0;
  }

  return getVariableValueFromEntity(entity, variableName, entityType);
}

/**
 * Get variable value from a single entity
 */
function getVariableValueFromEntity(
  entity: Record<string, any>,
  variableName: string,
  _entityType: EntityType
): number {
  const value = entity[variableName];
  if (value === undefined) {
    return 0;
  }
  return typeof value === 'number' ? value : 0;
}

/**
 * Get the ID field name for an entity type
 */
function getEntityIdField(entityType: EntityType): string {
  if (entityType === 'person') {
    return 'person_id';
  }
  return `${entityType}_id`;
}

/**
 * Get value for a specific person
 */
export function getPersonValue(
  household: Household,
  personId: number,
  variableName: string
): number | boolean | string | undefined {
  return HouseholdQueries.getPersonVariable(household, personId, variableName);
}

/**
 * Get value for a specific entity
 */
export function getEntityValue(
  household: Household,
  entityType: EntityType,
  entityId: number,
  variableName: string
): number | boolean | string | undefined {
  return HouseholdQueries.getEntityVariable(household, entityType, entityId, variableName);
}

/**
 * Gets input formatting properties for a variable based on its metadata
 * Determines prefix, suffix, decimal scale, and thousands separator
 * based on the variable's data_type and unit
 *
 * @param variable - The variable metadata
 * @returns Formatting properties for NumberInput components
 */
export function getInputFormattingProps(variable: any): {
  prefix?: string;
  suffix?: string;
  thousandSeparator: string;
  decimalScale?: number;
} {
  const currencyMap: Record<string, string> = {
    'currency-USD': '$',
    'currency-GBP': '£',
    'currency-EUR': '€',
  };

  // Determine decimal scale based on data_type (V2 API field)
  let decimalScale: number | undefined;
  if (variable.data_type === 'int' || variable.data_type === 'Enum') {
    decimalScale = 0;
  } else if (variable.data_type === 'float') {
    // For currency, use 2 decimals; for percentages use 2; otherwise use 0 for simplicity
    if (variable.unit && currencyMap[variable.unit]) {
      decimalScale = 2;
    } else if (variable.unit === '/1') {
      decimalScale = 2;
    } else {
      decimalScale = 0;
    }
  }

  // Currency formatting
  if (variable.unit && currencyMap[variable.unit]) {
    return {
      prefix: currencyMap[variable.unit],
      thousandSeparator: ',',
      decimalScale,
    };
  }

  // Percentage formatting
  if (variable.unit === '/1') {
    return {
      suffix: '%',
      thousandSeparator: ',',
      decimalScale,
    };
  }

  // Default formatting (plain number)
  return {
    thousandSeparator: ',',
    decimalScale,
  };
}

/**
 * Formats a variable value for display
 *
 * @param variable - The variable metadata
 * @param value - The value to format
 * @param precision - Number of decimal places (default: 0 for household overview)
 * @returns Formatted string
 */
export function formatVariableValue(variable: any, value: number, precision = 0): string {
  const currencyMap: Record<string, string> = {
    'currency-USD': '$',
    'currency-GBP': '£',
    'currency-EUR': '€',
  };

  if (variable.unit && currencyMap[variable.unit]) {
    const symbol = currencyMap[variable.unit];
    return (
      symbol +
      Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })
    );
  }

  if (variable.unit === '/1') {
    // Percentage
    return `${(value * 100).toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}%`;
  }

  return Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

/**
 * Gets parameter value at a specific instant in time
 *
 * @param parameter - The parameter metadata
 * @param instant - The instant in time (e.g., "2025-01-01")
 * @returns The parameter value at that instant
 */
export function getParameterAtInstant(parameter: any, instant: string): any {
  if (!parameter || !parameter.values) {
    return [];
  }

  // Find the most recent value that's not after the instant
  const entries = Object.entries(parameter.values).sort((a, b) => {
    return a[0].localeCompare(b[0]);
  });

  let result = null;
  for (const [date, value] of entries) {
    if (date <= instant) {
      result = value;
    } else {
      break;
    }
  }

  return result || [];
}

/**
 * Determines if a variable should be shown based on whether it has non-zero values
 * in baseline and/or reform scenarios
 *
 * @param variableName - The variable to check
 * @param householdBaseline - The baseline household data
 * @param householdReform - The reform household data (optional)
 * @param metadata - The metadata
 * @param forceShow - If true, always show even if zero
 * @returns True if the variable should be displayed
 */
export function shouldShowVariable(
  variableName: string,
  householdBaseline: Household,
  householdReform: Household | null,
  metadata: HouseholdMetadataContext,
  forceShow = false
): boolean {
  if (forceShow) {
    return true;
  }

  const baselineValue = getValueFromHousehold(variableName, null, householdBaseline, metadata);

  const isNonZeroInBaseline =
    typeof baselineValue === 'number' ? baselineValue !== 0 : baselineValue.some((v) => v !== 0);

  if (!householdReform) {
    return isNonZeroInBaseline;
  }

  const reformValue = getValueFromHousehold(variableName, null, householdReform, metadata);

  const isNonZeroInReform =
    typeof reformValue === 'number' ? reformValue !== 0 : reformValue.some((v) => v !== 0);

  return isNonZeroInBaseline || isNonZeroInReform;
}

/**
 * Sum a variable across all entities of a type
 */
export function sumVariable(
  household: Household,
  entityType: EntityType,
  variableName: string
): number {
  const entities = HouseholdQueries.getEntitiesByType(household, entityType);
  return entities.reduce((sum, entity) => {
    const value = entity[variableName];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Get the simulation year from household
 */
export function getSimulationYear(household: Household): number {
  return household.year;
}
