/**
 * Helpers for reading and formatting parameter values from metadata.
 * Shared by the flagship Build page and the reform composer.
 */

/** Latest value whose start date is not in the future. */
export function getCurrentValue(values: Record<string, any> | undefined | null): any {
  if (!values) {
    return undefined;
  }
  const today = new Date().toISOString().slice(0, 10);
  const applicable = Object.keys(values)
    .filter((date) => date <= today)
    .sort();
  const key = applicable[applicable.length - 1] ?? Object.keys(values).sort()[0];
  return key !== undefined ? values[key] : undefined;
}

export function formatValue(value: any, unit: string | null): string {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'on' : 'off';
  }
  if (typeof value === 'number' && unit?.startsWith('currency-')) {
    const currency = unit === 'currency-GBP' ? '£' : '$';
    return `${currency}${value.toLocaleString()}`;
  }
  if (typeof value === 'number' && unit === '/1') {
    return `${Math.round(value * 100 * 100) / 100}%`;
  }
  return String(value);
}
