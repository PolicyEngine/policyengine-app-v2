/**
 * Helpers for reading and formatting parameter values from metadata.
 * Used by the flagship (v3) Build page, reform editor and reports.
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

/**
 * The money symbol for each spelling of a currency unit the country
 * models use: most UK parameters say "currency-GBP", but a few say
 * "GBP" or "currency_GBP".
 */
export const CURRENCY_UNIT_SYMBOLS: Readonly<Record<string, string>> = {
  'currency-USD': '$',
  currency_USD: '$',
  USD: '$',
  'currency-GBP': '£',
  currency_GBP: '£',
  GBP: '£',
};

/** The money symbol a unit's values carry, or null for a unit that is not money. */
export function currencySymbolForUnit(unit: string | null | undefined): string | null {
  if (!unit) {
    return null;
  }
  return CURRENCY_UNIT_SYMBOLS[unit] ?? (unit.startsWith('currency-') ? '$' : null);
}

/** Units stored as a fraction of 1 and read as a percentage. */
export function isPercentageUnit(unit: string | null | undefined): boolean {
  return unit === '/1' || unit === 'marginal-rate';
}

/**
 * A parameter value as the flagship (v3) pages show it as text. Only
 * flagship code reads it; legacy pages format values on their own.
 */
export function formatValue(value: any, unit: string | null): string {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  const currency = currencySymbolForUnit(unit);
  if (typeof value === 'number' && currency) {
    // The sign goes before the symbol: "−£500", not "£-500".
    return `${value < 0 ? '−' : ''}${currency}${Math.abs(value).toLocaleString()}`;
  }
  if (typeof value === 'number' && isPercentageUnit(unit)) {
    return `${Math.round(value * 100 * 100) / 100}%`;
  }
  return String(value);
}
