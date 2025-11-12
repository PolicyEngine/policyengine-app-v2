/**
 * Utility functions for chart axis configuration
 *
 * Note: For value formatting, use formatValueByUnit from formatters.ts
 */

import { getCurrencySymbolFromUnit, isCurrencyUnit, isBooleanUnit } from './formatters';

export interface PlotlyAxisFormat {
  tickformat?: string;
  tickprefix?: string;
  ticksuffix?: string;
  tickvals?: number[];
  ticktext?: string[];
  range?: [number | string, number | string];
  type?: 'linear' | 'log' | 'date' | 'category';
}

/**
 * Gets Plotly axis formatting configuration for different data types
 * @param dataType - Type of data ('date' or unit type like 'currency-USD')
 * @param values - Array of values to determine range
 * @returns Plotly axis configuration object
 */
export function getPlotlyAxisFormat(
  dataType: 'date' | string,
  values: (string | number)[]
): PlotlyAxisFormat {
  if (dataType === 'date') {
    // Date axis
    const dateValues = values.map((v) => new Date(String(v)).getTime());
    const validDates = dateValues.filter((v) => !isNaN(v));

    if (validDates.length === 0) {
      return { type: 'date' };
    }

    const minDate = Math.min(...validDates);
    const maxDate = Math.max(...validDates);

    return {
      type: 'date',
      range: [
        new Date(minDate).toISOString().split('T')[0],
        new Date(maxDate).toISOString().split('T')[0],
      ],
    };
  }

  // Value axis - handle different units
  const unit = dataType;
  const numericValues = values.map((v) => Number(v)).filter((v) => !isNaN(v));

  if (numericValues.length === 0) {
    return {};
  }

  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);

  if (unit === '/1') {
    // Percentage
    return {
      tickformat: '.1%',
      range: [minValue, maxValue],
    };
  }

  // Use centralized currency detection
  if (isCurrencyUnit(unit)) {
    const symbol = getCurrencySymbolFromUnit(unit);
    return {
      tickprefix: symbol,
      tickformat: ',.0f',
      range: [minValue, maxValue],
    };
  }

  // Use centralized boolean detection
  if (isBooleanUnit(unit)) {
    return {
      tickvals: [0, 1],
      ticktext: ['False', 'True'],
      range: [-0.1, 1.1],
    };
  }

  // Default numeric
  return {
    tickformat: ',.2f',
    range: [minValue, maxValue],
  };
}
