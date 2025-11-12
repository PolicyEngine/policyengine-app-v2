/**
 * Formatting utilities ported from v1 app
 * Original: policyengine-app/src/lang/format.js
 */

import { countryIds } from '@/libs/countries';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';

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
 * Get the currency symbol for the country
 */
export function currencySymbol(countryId: CountryId): string {
  return countryId === 'uk' ? '£' : '$';
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

/**
 * Unit type constants for consistent unit handling across the app
 */
export const CURRENCY_UNITS = {
  USD: ['currency-USD', 'currency_USD', 'USD'],
  GBP: ['currency-GBP', 'currency_GBP', 'GBP'],
  EUR: ['currency-EUR', 'currency_EUR', 'EUR'],
  CAD: ['currency-CAD', 'currency_CAD', 'CAD'],
  ILS: ['currency-ILS', 'currency_ILS', 'ILS'],
  NGN: ['currency-NGN', 'currency_NGN', 'NGN'],
} as const;

export const PERCENTAGE_UNITS = ['/1'] as const;
export const BOOLEAN_UNITS = ['bool', 'abolition'] as const;

/**
 * Check if a unit represents currency
 */
export function isCurrencyUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return Object.values(CURRENCY_UNITS).some((units) => (units as readonly string[]).includes(unit));
}

/**
 * Check if a unit represents a percentage
 */
export function isPercentageUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return (PERCENTAGE_UNITS as readonly string[]).includes(unit);
}

/**
 * Check if a unit represents a boolean
 */
export function isBooleanUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return (BOOLEAN_UNITS as readonly string[]).includes(unit);
}

/**
 * Get the country ID from a currency unit
 * @param unit - The unit string (e.g., 'currency-USD', 'USD', 'GBP')
 * @returns The country ID ('us', 'uk') or null if not a currency unit
 */
export function getCountryFromUnit(unit: string | null | undefined): CountryId | null {
  if (!unit) return null;

  if (CURRENCY_UNITS.USD.includes(unit as any)) return 'us';
  if (CURRENCY_UNITS.GBP.includes(unit as any)) return 'uk';

  return null;
}

/**
 * Get the currency symbol from a unit string
 * @param unit - The unit string (e.g., 'currency-USD', 'GBP')
 * @returns The currency symbol ($, £, €, ₪, ₦) or empty string
 */
export function getCurrencySymbolFromUnit(unit: string | null | undefined): string {
  if (!unit) return '';

  if (CURRENCY_UNITS.USD.includes(unit as any)) return '$';
  if (CURRENCY_UNITS.GBP.includes(unit as any)) return '£';
  if (CURRENCY_UNITS.EUR.includes(unit as any)) return '€';
  if (CURRENCY_UNITS.CAD.includes(unit as any)) return '$'; // Canadian dollar uses $
  if (CURRENCY_UNITS.ILS.includes(unit as any)) return '₪'; // Israeli Shekel
  if (CURRENCY_UNITS.NGN.includes(unit as any)) return '₦'; // Nigerian Naira

  return '';
}

/**
 * Format a value based on its unit type
 * This is the canonical formatting function that handles all unit types
 *
 * @param value - The value to format
 * @param unit - The unit type (e.g., 'currency-USD', '/1', 'bool')
 * @param countryId - The country ID for locale-specific formatting
 * @param options - Additional formatting options
 * @returns Formatted string representation of the value
 */
export function formatValueByUnit(
  value: any,
  unit: string | null | undefined,
  countryId: CountryId,
  options?: {
    decimalPlaces?: number;
    includeSymbol?: boolean;
  }
): string {
  const { decimalPlaces, includeSymbol = true } = options || {};

  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle boolean
  if (isBooleanUnit(unit)) {
    return value ? 'True' : 'False';
  }

  // Handle percentage
  if (isPercentageUnit(unit)) {
    const percentage = Number(value) * 100;
    const precision = decimalPlaces !== undefined ? decimalPlaces : (percentage % 1 !== 0 ? 2 : 0);
    return `${percentage.toFixed(precision)}%`;
  }

  // Handle currency
  if (isCurrencyUnit(unit)) {
    const numValue = Number(value);
    const unitCountry = getCountryFromUnit(unit);
    const targetCountry = unitCountry || countryId;
    const symbol = includeSymbol ? getCurrencySymbolFromUnit(unit) : '';

    // Determine precision: use provided, or auto-detect (0 for int, 2 for float)
    const precision = decimalPlaces !== undefined
      ? decimalPlaces
      : (numValue % 1 !== 0 ? 2 : 0);

    const formatted = numValue.toLocaleString(localeCode(targetCountry), {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });

    return `${symbol}${formatted}`;
  }

  // Default numeric formatting
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return String(value);
  }

  const precision = decimalPlaces !== undefined
    ? decimalPlaces
    : (numValue % 1 !== 0 ? 2 : 0);

  return numValue.toLocaleString(localeCode(countryId), {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

/**
 * Format a parameter value by looking up its metadata to determine the correct unit
 * This is the canonical way to format parameter values throughout the application
 *
 * @param parameterName - The parameter name (e.g., 'gov.irs.credits.eitc.max[0]')
 * @param value - The value to format
 * @param parameters - The parameter metadata record from Redux state
 * @param countryId - The country ID for locale-specific formatting
 * @param options - Additional formatting options
 * @returns Formatted string representation of the parameter value
 */
export function formatParameterValueFromMetadata(
  parameterName: string,
  value: any,
  parameters: Record<string, ParameterMetadata>,
  countryId: CountryId,
  options?: {
    decimalPlaces?: number;
    includeSymbol?: boolean;
  }
): string {
  // Look up the parameter metadata to get the unit
  const metadata = parameters[parameterName];
  const unit = metadata?.unit;

  // If no metadata or unit found, format as generic value with country-appropriate currency
  if (!unit) {
    if (typeof value === 'boolean') {
      return formatValueByUnit(value, 'bool', countryId, options);
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return String(value);
    }

    // Default to country's currency for numeric values without unit metadata
    const defaultUnit = countryId === 'us' ? 'currency-USD' : 'currency-GBP';
    return formatValueByUnit(numValue, defaultUnit, countryId, options);
  }

  // Use the canonical formatter with the unit from metadata
  return formatValueByUnit(value, unit, countryId, options);
}
