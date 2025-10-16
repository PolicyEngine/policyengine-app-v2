import type { Layout } from 'plotly.js';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { DEFAULT_CHART_START_DATE, DEFAULT_CHART_END_DATE } from '@/constants/chart';

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

/**
 * Extends date and value arrays to 2099 for visual continuity in charts
 * This makes the line appear to extend indefinitely into the future
 * @param dates - Array of date strings to extend
 * @param values - Array of values to extend
 */
export function extendDataToFuture(dates: string[], values: any[]): void {
  const extendDate = '2099-12-31';
  dates.push(extendDate);
  values.push(values[values.length - 1]);
}

/**
 * Builds combined axis values from base and reform data for proper chart range
 * Filters out placeholder dates and adds chart boundaries
 * @param baseDates - Base policy dates
 * @param reformDates - Reform policy dates (optional)
 * @returns Combined and filtered date array for x-axis range
 */
export function buildXAxisValues(baseDates: string[], reformDates: string[] = []): string[] {
  // Combine dates
  let xaxisValues = reformDates.length > 0 ? [...baseDates, ...reformDates] : baseDates;

  // Filter out placeholder dates and future extension
  xaxisValues = xaxisValues.filter((date) => date !== '0000-01-01' && date < '2099-12-31');

  // Add chart boundaries
  xaxisValues.push(DEFAULT_CHART_START_DATE);
  xaxisValues.push(DEFAULT_CHART_END_DATE);

  return xaxisValues;
}

/**
 * Builds combined y-axis values from base and reform data for proper chart range
 * @param baseValues - Base policy values
 * @param reformValues - Reform policy values (optional)
 * @returns Combined value array for y-axis range
 */
export function buildYAxisValues(baseValues: any[], reformValues: any[] = []): any[] {
  return reformValues.length > 0 ? [...baseValues, ...reformValues] : baseValues;
}

/**
 * Calculates chart height based on viewport and responsive settings
 * @param isMobile - Whether the viewport is mobile size
 * @param viewportHeight - Current viewport height in pixels
 * @param mobileHeightRatio - Ratio of viewport height to use on mobile
 * @param desktopHeight - Fixed height for desktop in pixels
 * @param minHeight - Minimum height constraint in pixels
 * @returns Calculated chart height in pixels
 */
export function calculateChartHeight(
  isMobile: boolean,
  viewportHeight: number,
  mobileHeightRatio: number,
  desktopHeight: number,
  minHeight: number
): number {
  if (isMobile) {
    return Math.max(viewportHeight * mobileHeightRatio, minHeight);
  }
  return desktopHeight;
}
