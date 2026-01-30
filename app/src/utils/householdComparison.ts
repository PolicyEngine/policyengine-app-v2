/**
 * householdComparison - Comparison utilities for API v2 Alpha household structure
 *
 * These functions compare baseline and reform household values.
 * Works with the array-based household structure with flat values.
 */

import { Household } from '@/types/ingredients/Household';
import { getValueFromHousehold, HouseholdMetadataContext } from './householdValues';

/**
 * Represents the comparison between baseline and reform values for a variable
 */
export interface VariableComparison {
  displayValue: number;
  direction: 'increase' | 'decrease' | 'no-change';
  baselineValue: number;
  reformValue?: number;
}

/**
 * Calculates the comparison between baseline and reform values for a variable
 *
 * In single mode (no reform): returns baseline value with 'no-change' direction
 * In comparison mode (with reform): returns absolute difference with direction
 *
 * @param variableName - The variable to compare
 * @param baseline - The baseline household
 * @param reform - The reform household (null for single mode)
 * @param metadata - The metadata context (variables from Redux + entities from static data)
 * @returns Comparison result with display value and direction
 */
export function calculateVariableComparison(
  variableName: string,
  baseline: Household,
  reform: Household | null,
  metadata: HouseholdMetadataContext
): VariableComparison {
  const baselineValue = getValueFromHousehold(variableName, null, baseline, metadata);
  const baselineNumeric = typeof baselineValue === 'number' ? baselineValue : 0;

  if (!reform) {
    return {
      displayValue: baselineNumeric,
      direction: 'no-change',
      baselineValue: baselineNumeric,
    };
  }

  const reformValue = getValueFromHousehold(variableName, null, reform, metadata);
  const reformNumeric = typeof reformValue === 'number' ? reformValue : 0;
  const difference = reformNumeric - baselineNumeric;

  return {
    displayValue: Math.abs(difference),
    direction: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'no-change',
    baselineValue: baselineNumeric,
    reformValue: reformNumeric,
  };
}

/**
 * Calculate percentage change between baseline and reform
 */
export function calculatePercentageChange(
  variableName: string,
  baseline: Household,
  reform: Household,
  metadata: HouseholdMetadataContext
): number {
  const baselineValue = getValueFromHousehold(variableName, null, baseline, metadata);
  const reformValue = getValueFromHousehold(variableName, null, reform, metadata);

  const baselineNumeric = typeof baselineValue === 'number' ? baselineValue : 0;
  const reformNumeric = typeof reformValue === 'number' ? reformValue : 0;

  if (baselineNumeric === 0) {
    return reformNumeric === 0 ? 0 : Infinity;
  }

  return ((reformNumeric - baselineNumeric) / Math.abs(baselineNumeric)) * 100;
}

/**
 * Compare multiple variables and return sorted by impact
 */
export function compareMultipleVariables(
  variableNames: string[],
  baseline: Household,
  reform: Household,
  metadata: HouseholdMetadataContext
): Array<{ variableName: string; comparison: VariableComparison }> {
  const results = variableNames.map((variableName) => ({
    variableName,
    comparison: calculateVariableComparison(variableName, baseline, reform, metadata),
  }));

  // Sort by absolute impact (largest first)
  return results.sort((a, b) => b.comparison.displayValue - a.comparison.displayValue);
}
