import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import { MetadataState } from '@/types/metadata';
import { getValueFromHouseholdCalculationOutput } from './householdCalculationOutput';
import { normalizeVariableValueType } from './variableMetadata';

export const getValueFromHousehold = getValueFromHouseholdCalculationOutput;
export { getValueFromHouseholdCalculationOutput };

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
  const valueType = normalizeVariableValueType(
    variable?.valueType ?? variable?.value_type ?? variable?.data_type
  );
  const unit = variable?.unit ?? variable?.variable_unit ?? null;
  const currencyMap: Record<string, string> = {
    'currency-USD': '$',
    'currency-GBP': '£',
    'currency-EUR': '€',
  };

  // Determine decimal scale based on valueType
  let decimalScale: number | undefined;
  if (valueType === 'int' || valueType === 'Enum') {
    decimalScale = 0;
  } else if (valueType === 'float') {
    // For currency, use 2 decimals; for percentages use 2; otherwise use 0 for simplicity
    if (unit && currencyMap[unit]) {
      decimalScale = 2;
    } else if (unit === '/1') {
      decimalScale = 2;
    } else {
      decimalScale = 0;
    }
  }

  // Currency formatting
  if (unit && currencyMap[unit]) {
    return {
      prefix: currencyMap[unit],
      thousandSeparator: ',',
      decimalScale,
    };
  }

  // Percentage formatting
  if (unit === '/1') {
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
  householdBaseline: HouseholdCalculationOutput,
  householdReform: HouseholdCalculationOutput | null,
  metadata: MetadataState,
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
