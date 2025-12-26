import { VariableComparison } from './householdComparison';

/**
 * Generates the display text for a variable in single or comparison mode
 *
 * Single mode: "Your [variable label] is/are"
 * Comparison mode: "Your [variable label] increased/decreased by"
 *
 * @param variableLabel - The label of the variable
 * @param comparison - The comparison result
 * @param isComparisonMode - Whether we're in comparison mode
 * @returns The display text
 */
export function getVariableDisplayText(
  variableLabel: string,
  comparison: VariableComparison,
  isComparisonMode: boolean
): string {
  if (!isComparisonMode) {
    const verb = variableLabel.endsWith('s') ? 'are' : 'is';
    return `Your ${variableLabel} ${verb}`;
  }

  if (comparison.direction === 'no-change') {
    return `Your ${variableLabel} stayed the same at`;
  }

  const verb = comparison.direction === 'increase' ? 'increased' : 'decreased';
  return `Your ${variableLabel} ${verb} by`;
}

/**
 * Generates the title text for the household overview page
 *
 * @param variableLabel - The label of the root variable (e.g., "net income")
 * @param comparison - The comparison result
 * @param isComparisonMode - Whether we're in comparison mode
 * @param formattedValue - The formatted value string
 * @returns The title text
 */
export function getTitleText(
  variableLabel: string,
  comparison: VariableComparison,
  isComparisonMode: boolean,
  formattedValue: string
): string {
  if (!isComparisonMode) {
    return `Your ${variableLabel} is ${formattedValue}`;
  }

  if (comparison.direction === 'no-change') {
    return `Your ${variableLabel} stayed the same`;
  }

  const verb = comparison.direction === 'increase' ? 'increased' : 'decreased';
  return `Your ${variableLabel} ${verb} by ${formattedValue}`;
}
