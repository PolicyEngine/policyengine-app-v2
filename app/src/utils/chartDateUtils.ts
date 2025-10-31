import {
  CHART_DISPLAY_EXTENSION_DATE,
  DEFAULT_CHART_END_DATE,
  DEFAULT_CHART_START_DATE,
} from '@/constants/chartConstants';

/**
 * TEMPORARY: Filters out infinite values from chart data until API v1 properly handles them
 * Infinite values cannot be displayed on a Cartesian plane and break axis calculations
 * @param dates - Array of ISO date strings
 * @param values - Array of corresponding values
 * @returns Object with filtered dates and values arrays
 */
export function filterInfiniteValues(
  dates: string[],
  values: any[]
): { filteredDates: string[]; filteredValues: any[] } {
  const filteredDates: string[] = [];
  const filteredValues: any[] = [];

  for (let i = 0; i < values.length; i++) {
    const numValue = Number(values[i]);
    if (!isFinite(numValue)) {
      continue; // Skip infinite values
    }
    filteredDates.push(dates[i]);
    filteredValues.push(values[i]);
  }

  return { filteredDates, filteredValues };
}

/**
 * Filters out invalid dates and dates beyond display extension
 * @param dates - Array of ISO date strings
 * @returns Filtered array of valid dates
 */
export function filterValidChartDates(dates: string[]): string[] {
  return dates.filter((date) => date !== '0000-01-01' && date < CHART_DISPLAY_EXTENSION_DATE);
}

/**
 * Gets all unique dates from base and reform collections, sorted
 * @param baseDates - Array of dates from base/current law data
 * @param reformDates - Array of dates from reform data
 * @returns Sorted array of unique dates
 */
export function getAllChartDates(baseDates: string[], reformDates: string[]): string[] {
  const allDates = [...baseDates, ...reformDates];
  const uniqueDates = Array.from(new Set(allDates));
  return uniqueDates.sort();
}

/**
 * Extends data arrays to display extension date for visual infinity
 * Mutates the input arrays by pushing the extension date and repeating the last value
 * @param x - Array of date strings (will be mutated)
 * @param y - Array of values corresponding to dates (will be mutated)
 */
export function extendForDisplay(x: string[], y: any[]): void {
  if (y.length === 0) {
    return; // Can't extend empty array
  }
  x.push(CHART_DISPLAY_EXTENSION_DATE);
  y.push(y[y.length - 1]);
}

/**
 * Gets the boundary dates for chart x-axis
 * @returns Object with minDate and maxDate for chart boundaries
 */
export function getChartBoundaryDates(): {
  minDate: string;
  maxDate: string;
} {
  return {
    minDate: DEFAULT_CHART_START_DATE,
    maxDate: DEFAULT_CHART_END_DATE,
  };
}
