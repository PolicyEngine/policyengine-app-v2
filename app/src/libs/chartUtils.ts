import type { Layout } from 'plotly.js';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';

/**
 * Formats a parameter value for display based on its unit type
 * @param param - Parameter metadata containing unit information
 * @param value - The value to format
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted string representation of the value
 */
export function formatParameterValue(
  param: ParameterMetadata,
  value: any,
  precision: number = 2
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const unit = param.unit?.toLowerCase() || '';

  // Handle boolean values
  if (unit === 'bool' || typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  // Convert to number
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) {
    return 'N/A';
  }

  // Handle currency units
  const USD_UNITS = ['currency-usd', 'currency_usd', 'usd'];
  const GBP_UNITS = ['currency-gbp', 'currency_gbp', 'gbp'];

  if (USD_UNITS.includes(unit)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(numValue);
  }

  if (GBP_UNITS.includes(unit)) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(numValue);
  }

  // Handle percentage units
  if (unit === '/1' || unit === 'percent' || unit === 'percentage') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(numValue);
  }

  // Handle other numeric units
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(numValue);
}

/**
 * Generates Plotly axis formatting configuration based on unit type and values
 * @param unit - The unit type ('date', currency types, percentage, etc.)
 * @param values - Array of values to determine range and formatting
 * @returns Partial Plotly axis layout configuration
 */
export function getPlotlyAxisFormat(
  unit: string,
  values: any[]
): Partial<Layout['xaxis']> {
  const unitLower = unit?.toLowerCase() || '';

  // Handle date axis
  if (unitLower === 'date') {
    return {
      type: 'date',
      tickformat: '%Y',
      dtick: 'M12', // Show tick every 12 months (yearly)
      tickmode: 'linear',
      title: { text: '' },
      showgrid: true,
      gridcolor: '#e9ecef',
      showline: true,
      linecolor: '#dee2e6',
    };
  }

  // Get numeric values for range calculation
  const numericValues = values
    .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
    .filter((v) => !isNaN(v));

  if (numericValues.length === 0) {
    return {
      title: { text: '' },
      showgrid: true,
      gridcolor: '#e9ecef',
    };
  }

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const range = maxValue - minValue;

  // Base configuration for numeric axes
  const baseConfig: Partial<Layout['xaxis']> = {
    showgrid: true,
    gridcolor: '#e9ecef',
    showline: true,
    linecolor: '#dee2e6',
    zeroline: false,
  };

  // Handle currency units
  const USD_UNITS = ['currency-usd', 'currency_usd', 'usd'];
  const GBP_UNITS = ['currency-gbp', 'currency_gbp', 'gbp'];

  if (USD_UNITS.includes(unitLower)) {
    return {
      ...baseConfig,
      tickformat: '$,.0f',
      title: { text: '' },
      hoverformat: '$,.2f',
    };
  }

  if (GBP_UNITS.includes(unitLower)) {
    return {
      ...baseConfig,
      tickformat: '£,.0f',
      title: { text: '' },
      hoverformat: '£,.2f',
    };
  }

  // Handle percentage units
  if (unitLower === '/1' || unitLower === 'percent' || unitLower === 'percentage') {
    return {
      ...baseConfig,
      tickformat: '.1%',
      title: { text: '' },
      hoverformat: '.2%',
    };
  }

  // Handle boolean units
  if (unitLower === 'bool' || unitLower === 'boolean') {
    return {
      ...baseConfig,
      tickmode: 'array',
      tickvals: [0, 1],
      ticktext: ['False', 'True'],
      title: { text: '' },
      range: [-0.1, 1.1],
    };
  }

  // Default numeric formatting
  // Determine appropriate number of decimal places based on range
  let tickformat = ',.0f';
  if (range < 1) {
    tickformat = ',.3f';
  } else if (range < 10) {
    tickformat = ',.2f';
  } else if (range < 100) {
    tickformat = ',.1f';
  }

  return {
    ...baseConfig,
    tickformat,
    title: { text: '' },
  };
}
