/**
 * householdValues - Value extraction utilities for API v2 Alpha household structure
 *
 * Entity groups are single flat dicts (not arrays).
 * People are identified by array index.
 * Values are flat (no year-keying) - year is at the household level.
 */

import type { EntitiesRecord } from '@/data/static';
import { EntityType, Household } from '@/types/ingredients/Household';

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
 * Works with the v2 single-dict entity structure
 *
 * @param variableName - The name of the variable to extract
 * @param entityId - For person vars: array index or null for first person. For entities: ignored (single dict).
 * @param household - The household data structure
 * @param metadata - The metadata containing variable definitions and entities
 * @param valueFromFirstOnly - Unused (kept for API compatibility) - entities are single dicts now
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

  if (entityType === 'person') {
    // For person variables
    if (entityId !== null) {
      // Specific person by index
      const person = household.people[entityId];
      if (!person) {
        return 0;
      }
      const value = person[variableName];
      return typeof value === 'number' ? value : 0;
    }
    // Aggregate across all people or return first
    if (household.people.length === 0) {
      return 0;
    }
    if (household.people.length === 1 || valueFromFirstOnly) {
      const value = household.people[0][variableName];
      return typeof value === 'number' ? value : 0;
    }
    // Sum across all people
    return household.people.reduce((sum, person) => {
      const value = person[variableName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  // For group entities: access the single dict directly
  const entity = household[entityType as keyof Household] as Record<string, any> | undefined;
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    return 0;
  }

  const value = entity[variableName];
  return typeof value === 'number' ? value : 0;
}

/**
 * Get value for a specific person by array index
 */
export function getPersonValue(
  household: Household,
  personIndex: number,
  variableName: string
): number | boolean | string | undefined {
  return household.people[personIndex]?.[variableName];
}

/**
 * Get value for a specific entity (single dict access)
 */
export function getEntityValue(
  household: Household,
  entityType: EntityType,
  variableName: string
): number | boolean | string | undefined {
  if (entityType === 'person') {
    return household.people[0]?.[variableName];
  }
  const entity = household[entityType as keyof Household] as Record<string, any> | undefined;
  return entity?.[variableName];
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
 * Sum a variable across all entities of a type.
 * For person: sums across all people. For others: returns value from single dict.
 */
export function sumVariable(
  household: Household,
  entityType: EntityType,
  variableName: string
): number {
  if (entityType === 'person') {
    return household.people.reduce((sum, person) => {
      const value = person[variableName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  const entity = household[entityType as keyof Household] as Record<string, any> | undefined;
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    return 0;
  }
  const value = entity[variableName];
  return typeof value === 'number' ? value : 0;
}

/**
 * Get the simulation year from household
 */
export function getSimulationYear(household: Household): number {
  return household.year;
}
