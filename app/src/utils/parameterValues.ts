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

/**
 * Pulls a proposed value out of a natural-language question, when it can
 * be done confidently: "raise the CTC to $3,600" → 3600 for a currency
 * parameter, "cut the rate to 4.45%" → 0.0445 for a /1 parameter.
 * Returns undefined rather than guessing.
 */
export function parseValueFromQuestion(question: string, unit: string | null): number | undefined {
  const matches = [...question.matchAll(/([$£]?)([\d][\d,]*(?:\.\d+)?)(%?)/g)];
  if (matches.length === 0) {
    return undefined;
  }
  // The target amount is almost always the last number mentioned
  const [, currencySign, digits, percentSign] = matches[matches.length - 1];
  const value = Number(digits.replace(/,/g, ''));
  if (Number.isNaN(value)) {
    return undefined;
  }

  if (unit?.startsWith('currency-')) {
    return percentSign ? undefined : value;
  }
  if (unit === '/1') {
    // toPrecision avoids float artifacts like 4.45 / 100 = 0.044500000000000005
    return percentSign ? Number((value / 100).toPrecision(12)) : undefined;
  }
  if (currencySign || percentSign) {
    // Mismatched unit — do not guess
    return undefined;
  }
  return value;
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
