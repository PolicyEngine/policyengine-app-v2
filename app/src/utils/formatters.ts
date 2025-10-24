/**
 * Formatting utilities ported from v1 app
 * Original: policyengine-app/src/lang/format.js
 */

import { countryIds } from '@/libs/countries';

type CountryId = (typeof countryIds)[number];

/**
 * Get the Unicode locale identifier for the country
 */
export function localeCode(countryId: CountryId): string {
  return countryId === 'uk' ? 'en-GB' : 'en-US';
}

/**
 * Get the ISO 4217 currency code for the country
 */
export function currencyCode(countryId: CountryId): string {
  return countryId === 'uk' ? 'GBP' : 'USD';
}

/**
 * Format a number according to locale
 */
export function formatNumber(
  number: number,
  countryId: CountryId,
  options?: Intl.NumberFormatOptions
): string {
  return number.toLocaleString(localeCode(countryId), options);
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  number: number,
  countryId: CountryId,
  options?: Intl.NumberFormatOptions
): string {
  return number.toLocaleString(localeCode(countryId), {
    style: 'currency',
    currency: currencyCode(countryId),
    ...options,
  });
}

/**
 * Format a number as percentage
 */
export function formatPercent(
  number: number,
  countryId: CountryId,
  options?: Intl.NumberFormatOptions
): string {
  return number.toLocaleString(localeCode(countryId), {
    style: 'percent',
    ...options,
  });
}

/**
 * Format currency with abbreviation (e.g., $2.3tn, -$12.3bn, $301m, $1.2k)
 */
export function formatCurrencyAbbr(
  number: number,
  countryId: CountryId,
  options?: Intl.NumberFormatOptions
): string {
  let suffix = '';
  let adjustedNumber = number;
  const absNumber = Math.abs(number);
  if (absNumber >= 1e12) {
    adjustedNumber /= 1e12;
    suffix = 'tn';
  } else if (absNumber >= 1e9) {
    adjustedNumber /= 1e9;
    suffix = 'bn';
  } else if (absNumber >= 1e6) {
    adjustedNumber /= 1e6;
    suffix = 'm';
  } else if (absNumber >= 1e3) {
    adjustedNumber /= 1e3;
    suffix = 'k';
  }
  return formatCurrency(adjustedNumber, countryId, options) + suffix;
}

/**
 * Format number with abbreviation (e.g., 2.3tn, 12.3bn, 301m, 1.2k)
 */
export function formatNumberAbbr(
  number: number,
  countryId: CountryId,
  options?: Intl.NumberFormatOptions
): string {
  let suffix = '';
  let adjustedNumber = number;
  const absNumber = Math.abs(number);
  if (absNumber >= 1e12) {
    adjustedNumber /= 1e12;
    suffix = 'tn';
  } else if (absNumber >= 1e9) {
    adjustedNumber /= 1e9;
    suffix = 'bn';
  } else if (absNumber >= 1e6) {
    adjustedNumber /= 1e6;
    suffix = 'm';
  } else if (absNumber >= 1e3) {
    adjustedNumber /= 1e3;
    suffix = 'k';
  }
  return formatNumber(adjustedNumber, countryId, options) + suffix;
}

/**
 * Convert a number to ordinal form (1st, 2nd, 3rd, etc.)
 * Ported from v1 format.js
 */
export function ordinal(number: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const rem = number % 100;
  return number + (suffixes[(rem - 20) % 10] || suffixes[rem] || suffixes[0]);
}

/**
 * Calculate display precision for an array of values
 * Ported from v1 format.js
 *
 * @param values - Array of numbers to analyze
 * @param multiplier - Multiplier applied to all numbers
 * @returns Appropriate number of decimal places for display
 */
export function precision(values: number[], multiplier: number): number {
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  values.forEach((v) => {
    if (v < minValue) {
      minValue = v;
    }
    if (v > maxValue) {
      maxValue = v;
    }
  });
  const intervalLength = values.length ? (maxValue - minValue) * multiplier : 0;
  return intervalLength > 10 || intervalLength <= 0
    ? 0
    : 1 - Math.round(Math.log10(intervalLength));
}
