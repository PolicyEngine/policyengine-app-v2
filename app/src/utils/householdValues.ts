import type { EntitiesRecord } from '@/data/static';
import { Household } from '@/types/ingredients/Household';

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
 * Based on the v1 app's getValueFromHousehold function
 *
 * @param variableName - The name of the variable to extract
 * @param timePeriod - Specific time period (e.g., "2025"), or null to aggregate all periods
 * @param entityName - Specific entity name (e.g., "your household"), or null to aggregate all entities
 * @param household - The household data structure
 * @param metadata - The metadata containing variable definitions and entities
 * @param valueFromFirstOnly - If true, only returns value from first entity (no aggregation)
 * @returns The extracted value (number or array)
 */
export function getValueFromHousehold(
  variableName: string,
  timePeriod: string | null,
  entityName: string | null,
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
  const entity = variable.entity;
  const entityPlural = metadata.entities[entity]?.plural;

  if (!entityPlural) {
    console.warn(`Entity ${entity} not found in metadata`);
    return 0;
  }

  const householdData = household.householdData;
  const entityGroup = householdData[entityPlural];

  if (!entityGroup) {
    console.warn(`Entity group ${entityPlural} not found in household data`);
    return 0;
  }

  // If no entityName specified, aggregate across all entities
  if (!entityName) {
    const possibleEntities = Object.keys(entityGroup);

    if (possibleEntities.length === 0) {
      return 0;
    }

    if (possibleEntities.length === 1 || valueFromFirstOnly) {
      return getValueFromHousehold(
        variableName,
        timePeriod,
        possibleEntities[0],
        household,
        metadata,
        valueFromFirstOnly
      );
    }

    // Aggregate across all entities
    let total: number | number[] = 0;
    for (const entity of possibleEntities) {
      const entityData = getValueFromHousehold(
        variableName,
        timePeriod,
        entity,
        household,
        metadata,
        valueFromFirstOnly
      );

      // Handle arrays
      if (Array.isArray(entityData)) {
        if (!Array.isArray(total)) {
          total = Array(entityData.length).fill(0);
        }
        for (let i = 0; i < entityData.length; i++) {
          (total as number[])[i] += entityData[i];
        }
      } else if (Array.isArray(total)) {
        console.warn('Mixed array and scalar values in aggregation');
      } else {
        total += entityData;
      }
    }
    return total;
  }

  // Get the specific entity
  const entityData = entityGroup[entityName];
  if (!entityData) {
    console.warn(`Entity ${entityName} not found in ${entityPlural}`);
    return 0;
  }

  // Get the variable data for this entity
  const variableData = entityData[variableName];
  if (!variableData) {
    // Variable might not exist for this entity - return 0
    return 0;
  }

  // If no timePeriod specified, aggregate across all time periods
  if (!timePeriod) {
    const possibleTimePeriods = Object.keys(variableData);
    let total = 0;
    for (const period of possibleTimePeriods) {
      const periodValue = getValueFromHousehold(
        variableName,
        period,
        entityName,
        household,
        metadata,
        valueFromFirstOnly
      );
      if (typeof periodValue === 'number') {
        total += periodValue;
      }
    }
    return total;
  }

  // Return the specific value
  const value = variableData[timePeriod];
  return value !== undefined ? value : 0;
}

/**
 * Gets input formatting properties for a variable based on its metadata
 * Determines prefix, suffix, decimal scale, and thousands separator
 * based on the variable's valueType and unit
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

  // Determine decimal scale based on valueType
  let decimalScale: number | undefined;
  if (variable.valueType === 'int' || variable.valueType === 'Enum') {
    decimalScale = 0;
  } else if (variable.valueType === 'float') {
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
 * Based on the v1 app's formatVariableValue function
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
 * Based on the v1 app's getParameterAtInstant function
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

  const baselineValue = getValueFromHousehold(
    variableName,
    null,
    null,
    householdBaseline,
    metadata
  );

  const isNonZeroInBaseline =
    typeof baselineValue === 'number' ? baselineValue !== 0 : baselineValue.some((v) => v !== 0);

  if (!householdReform) {
    return isNonZeroInBaseline;
  }

  const reformValue = getValueFromHousehold(variableName, null, null, householdReform, metadata);

  const isNonZeroInReform =
    typeof reformValue === 'number' ? reformValue !== 0 : reformValue.some((v) => v !== 0);

  return isNonZeroInBaseline || isNonZeroInReform;
}
