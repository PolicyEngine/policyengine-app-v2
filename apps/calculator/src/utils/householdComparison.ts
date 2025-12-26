import { Household } from '@/types/ingredients/Household';
import { MetadataState } from '@/types/metadata';
import { getValueFromHousehold } from './householdValues';

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
 * @param metadata - The metadata
 * @returns Comparison result with display value and direction
 */
export function calculateVariableComparison(
  variableName: string,
  baseline: Household,
  reform: Household | null,
  metadata: MetadataState
): VariableComparison {
  const baselineValue = getValueFromHousehold(variableName, null, null, baseline, metadata);
  const baselineNumeric = typeof baselineValue === 'number' ? baselineValue : 0;

  if (!reform) {
    return {
      displayValue: baselineNumeric,
      direction: 'no-change',
      baselineValue: baselineNumeric,
    };
  }

  const reformValue = getValueFromHousehold(variableName, null, null, reform, metadata);
  const reformNumeric = typeof reformValue === 'number' ? reformValue : 0;
  const difference = reformNumeric - baselineNumeric;

  return {
    displayValue: Math.abs(difference),
    direction: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'no-change',
    baselineValue: baselineNumeric,
    reformValue: reformNumeric,
  };
}
