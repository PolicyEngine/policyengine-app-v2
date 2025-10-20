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
