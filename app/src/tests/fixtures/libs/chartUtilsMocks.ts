import type { Layout } from 'plotly.js';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';

// Test parameter metadata
export const PARAM_USD: ParameterMetadata = {
  label: 'Income Tax Rate',
  type: 'parameter',
  parameter: 'tax.income.rate',
  unit: 'currency-USD',
  values: { '2020-01-01': 1000 },
};

export const PARAM_GBP: ParameterMetadata = {
  label: 'Universal Credit',
  type: 'parameter',
  parameter: 'benefits.uc',
  unit: 'currency-GBP',
  values: { '2020-01-01': 500 },
};

export const PARAM_PERCENTAGE: ParameterMetadata = {
  label: 'Tax Rate',
  type: 'parameter',
  parameter: 'tax.rate',
  unit: '/1',
  values: { '2020-01-01': 0.2 },
};

export const PARAM_BOOLEAN: ParameterMetadata = {
  label: 'Enabled',
  type: 'parameter',
  parameter: 'feature.enabled',
  unit: 'bool',
  values: { '2020-01-01': 1 },
};

export const PARAM_NUMERIC: ParameterMetadata = {
  label: 'Count',
  type: 'parameter',
  parameter: 'count',
  unit: 'people',
  values: { '2020-01-01': 100 },
};

// Test values for formatting
export const TEST_VALUES = {
  POSITIVE_INTEGER: 1000,
  POSITIVE_DECIMAL: 1234.56,
  NEGATIVE_INTEGER: -500,
  NEGATIVE_DECIMAL: -123.45,
  ZERO: 0,
  SMALL_DECIMAL: 0.123,
  LARGE_NUMBER: 1000000,
  NULL: null,
  UNDEFINED: undefined,
  BOOLEAN_TRUE: true,
  BOOLEAN_FALSE: false,
  STRING_NUMBER: '123.45',
  STRING_INVALID: 'invalid',
} as const;

// Expected formatted values
export const EXPECTED_FORMATTED = {
  USD_1000: '$1,000.00',
  USD_1234_56: '$1,234.56',
  USD_NEGATIVE_500: '-$500.00',
  USD_123_45: '$123.45',
  USD_ZERO: '$0.00',
  GBP_500: '£500.00',
  GBP_1234_56: '£1,234.56',
  PERCENTAGE_20: '20.00%',
  PERCENTAGE_0_123: '12.30%',
  PERCENTAGE_1: '100.00%',
  BOOLEAN_TRUE: 'True',
  BOOLEAN_FALSE: 'False',
  NUMERIC_1000: '1,000.00',
  NUMERIC_0_123: '0.123',
  NA: 'N/A',
} as const;

// Test date values
export const TEST_DATES = [
  '2020-01-01',
  '2021-01-01',
  '2022-01-01',
  '2023-01-01',
  '2024-01-01',
] as const;

// Test numeric arrays for axis formatting
export const TEST_NUMERIC_VALUES = {
  SMALL_RANGE: [0, 0.1, 0.2, 0.3], // Range < 1
  MEDIUM_RANGE: [0, 5, 10, 15], // Range 1-100
  LARGE_RANGE: [0, 500, 1000, 1500], // Range > 100
  CURRENCY: [1000, 2000, 3000, 4000],
  PERCENTAGE: [0.1, 0.2, 0.3, 0.4],
  BOOLEAN: [0, 1],
} as const;

// Expected axis format configurations
export const EXPECTED_AXIS_FORMAT_DATE: Partial<Layout['xaxis']> = {
  type: 'date',
  tickformat: '%Y',
  dtick: 'M12',
  tickmode: 'linear',
  title: { text: '' },
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
};

export const EXPECTED_AXIS_FORMAT_USD: Partial<Layout['xaxis']> = {
  tickformat: '$,.0f',
  title: { text: '' },
  hoverformat: '$,.2f',
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

export const EXPECTED_AXIS_FORMAT_GBP: Partial<Layout['xaxis']> = {
  tickformat: '£,.0f',
  title: { text: '' },
  hoverformat: '£,.2f',
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

export const EXPECTED_AXIS_FORMAT_PERCENTAGE: Partial<Layout['xaxis']> = {
  tickformat: '.1%',
  title: { text: '' },
  hoverformat: '.2%',
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

export const EXPECTED_AXIS_FORMAT_BOOLEAN: Partial<Layout['xaxis']> = {
  tickmode: 'array',
  tickvals: [0, 1],
  ticktext: ['False', 'True'],
  title: { text: '' },
  range: [-0.1, 1.1],
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

export const EXPECTED_AXIS_FORMAT_NUMERIC_SMALL: Partial<Layout['xaxis']> = {
  tickformat: ',.3f',
  title: { text: '' },
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

export const EXPECTED_AXIS_FORMAT_NUMERIC_MEDIUM: Partial<Layout['xaxis']> = {
  tickformat: ',.1f',
  title: { text: '' },
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

export const EXPECTED_AXIS_FORMAT_NUMERIC_LARGE: Partial<Layout['xaxis']> = {
  tickformat: ',.0f',
  title: { text: '' },
  showgrid: true,
  gridcolor: '#e9ecef',
  showline: true,
  linecolor: '#dee2e6',
  zeroline: false,
};

// Helper to check if axis formats match (ignoring undefined values)
export function expectAxisFormatToMatch(
  actual: Partial<Layout['xaxis']>,
  expected: Partial<Layout['xaxis']>
) {
  Object.keys(expected).forEach((key) => {
    const expectedValue = expected[key as keyof typeof expected];
    const actualValue = actual[key as keyof typeof actual];

    if (typeof expectedValue === 'object' && expectedValue !== null) {
      expectAxisFormatToMatch(
        actualValue as Partial<Layout['xaxis']>,
        expectedValue as Partial<Layout['xaxis']>
      );
    } else {
      // Skip undefined values in comparison
      if (expectedValue !== undefined) {
        expect(actualValue).toEqual(expectedValue);
      }
    }
  });
}
