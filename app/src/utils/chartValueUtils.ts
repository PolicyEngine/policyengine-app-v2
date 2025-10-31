/**
 * Utility functions for formatting parameter values and chart axes
 */

export interface FormatValueOptions {
  decimalPlaces?: number;
  includeSymbol?: boolean;
}

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
 * Formats a parameter value for display based on its unit
 * @param value - The value to format
 * @param unit - The unit type (e.g., 'currency-USD', '/1', 'bool')
 * @param options - Formatting options (decimal places, include symbol)
 * @returns Formatted string representation of the value
 */
export function formatParameterValue(
  value: any,
  unit: string | null | undefined,
  options: FormatValueOptions = {}
): string {
  const { decimalPlaces = 2, includeSymbol = true } = options;

  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle boolean
  if (unit === 'bool' || unit === 'abolition') {
    return value ? 'True' : 'False';
  }

  // Handle percentage
  if (unit === '/1') {
    const percentage = Number(value) * 100;
    return `${percentage.toFixed(decimalPlaces)}%`;
  }

  // Handle currency
  const currencyUnits = ['currency-USD', 'currency_USD', 'USD'];
  const gbpUnits = ['currency-GBP', 'currency_GBP', 'GBP'];

  if (currencyUnits.includes(unit || '')) {
    const symbol = includeSymbol ? '$' : '';
    return `${symbol}${Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}`;
  }

  if (gbpUnits.includes(unit || '')) {
    const symbol = includeSymbol ? '£' : '';
    return `${symbol}${Number(value).toLocaleString('en-GB', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })}`;
  }

  // Default numeric formatting
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  });
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

  const currencyUnits = ['currency-USD', 'currency_USD', 'USD'];
  const gbpUnits = ['currency-GBP', 'currency_GBP', 'GBP'];

  if (currencyUnits.includes(unit)) {
    return {
      tickprefix: '$',
      tickformat: ',.0f',
      range: [minValue, maxValue],
    };
  }

  if (gbpUnits.includes(unit)) {
    return {
      tickprefix: '£',
      tickformat: ',.0f',
      range: [minValue, maxValue],
    };
  }

  if (unit === 'bool' || unit === 'abolition') {
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
