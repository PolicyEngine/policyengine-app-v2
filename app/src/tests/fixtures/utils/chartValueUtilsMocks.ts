/**
 * Mock data and fixtures for testing chartValueUtils
 */

// Sample values for different unit types
export const CURRENCY_USD_VALUE = 12345.67;
export const CURRENCY_GBP_VALUE = 9876.54;
export const PERCENTAGE_VALUE = 0.2534; // 25.34%
export const BOOLEAN_TRUE_VALUE = true;
export const BOOLEAN_FALSE_VALUE = false;
export const NUMERIC_VALUE = 42.123456;
export const NULL_VALUE = null;
export const UNDEFINED_VALUE = undefined;
export const ZERO_VALUE = 0;
export const NEGATIVE_VALUE = -100.5;

// Unit type constants
export const UNITS = {
  USD: 'currency-USD',
  USD_UNDERSCORE: 'currency_USD',
  USD_SHORT: 'USD',
  GBP: 'currency-GBP',
  GBP_UNDERSCORE: 'currency_GBP',
  GBP_SHORT: 'GBP',
  PERCENTAGE: '/1',
  BOOLEAN: 'bool',
  ABOLITION: 'abolition',
  NUMERIC: 'numeric',
  NULL: null,
  UNDEFINED: undefined,
} as const;

// Expected formatted values
export const EXPECTED_FORMATS = {
  USD_WITH_SYMBOL: '$12,345.67',
  USD_WITHOUT_SYMBOL: '12,345.67',
  USD_ZERO_DECIMALS: '$12,346',
  GBP_WITH_SYMBOL: '£9,876.54',
  GBP_WITHOUT_SYMBOL: '9,876.54',
  PERCENTAGE_DEFAULT: '25.34%',
  PERCENTAGE_ZERO_DECIMALS: '25%',
  PERCENTAGE_ONE_DECIMAL: '25.3%',
  BOOLEAN_TRUE: 'True',
  BOOLEAN_FALSE: 'False',
  NUMERIC_DEFAULT: '42.12',
  NUMERIC_ZERO_DECIMALS: '42',
  NUMERIC_FOUR_DECIMALS: '42.1235',
  NULL: 'N/A',
  UNDEFINED: 'N/A',
  ZERO: '$0.00',
  NEGATIVE: '-$100.50',
} as const;

// Sample data arrays for axis formatting
export const SAMPLE_DATE_VALUES = ['2020-01-01', '2023-06-15', '2025-12-31'];

export const SAMPLE_NUMERIC_VALUES = [100, 200, 300, 400, 500];

export const SAMPLE_PERCENTAGE_VALUES = [0.1, 0.25, 0.5, 0.75, 1.0];

export const SAMPLE_BOOLEAN_VALUES = [0, 1];

export const SAMPLE_CURRENCY_VALUES = [1000, 5000, 10000, 25000, 50000];

export const EMPTY_VALUES: number[] = [];

export const INVALID_DATE_VALUES = ['invalid', 'not-a-date', ''];

// Expected axis formats
export function getExpectedDateAxisFormat() {
  return {
    type: 'date' as const,
    range: ['2020-01-01', '2025-12-31'],
  };
}

export function getExpectedPercentageAxisFormat() {
  return {
    tickformat: '.1%',
    range: [0.1, 1.0],
  };
}

export function getExpectedUSDAxisFormat() {
  return {
    tickprefix: '$',
    tickformat: ',.0f',
    range: [1000, 50000],
  };
}

export function getExpectedGBPAxisFormat() {
  return {
    tickprefix: '£',
    tickformat: ',.0f',
    range: [1000, 50000],
  };
}

export function getExpectedBooleanAxisFormat() {
  return {
    tickvals: [0, 1],
    ticktext: ['False', 'True'],
    range: [-0.1, 1.1],
  };
}

export function getExpectedNumericAxisFormat() {
  return {
    tickformat: ',.2f',
    range: [100, 500],
  };
}
