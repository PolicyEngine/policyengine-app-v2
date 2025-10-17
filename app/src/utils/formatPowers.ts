/**
 * Break large numbers into units of million, billion, trillion, etc.
 * Based on the v1 app's formatPowers function
 * @param value The value to be processed
 * @returns An array where the first item is the new display value, and the second is its postfix label
 */
export function formatPowers(value: number): [number, string] {
  const powers = new Map([
    [15, 'quadrillion'],
    [12, 'trillion'],
    [9, 'billion'],
    [6, 'million'],
  ]);
  let label = '';
  let displayValue = value;

  for (const [power, unit] of powers) {
    if (value / 10 ** power >= 1) {
      displayValue = value / 10 ** power;
      label = ` ${unit}`;
      break;
    }
  }
  return [Number(displayValue), label];
}

/**
 * Format a budgetary impact value with appropriate power suffix
 * @param value The budgetary impact value
 * @returns Object with display value and label
 */
export function formatBudgetaryImpact(value: number): { display: string; label: string } {
  const absValue = Math.abs(value);
  const [displayValue, label] = formatPowers(absValue);
  return {
    display: displayValue.toFixed(1),
    label,
  };
}

/**
 * Format a value in billions (for chart display)
 * @param value The value to format
 * @returns The value divided by 1 billion, formatted to 1 decimal place
 */
export function formatBillions(value: number): string {
  const billions = value / 1e9;
  return billions.toFixed(1);
}
