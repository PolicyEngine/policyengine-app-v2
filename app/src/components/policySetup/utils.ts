import dayjs from 'dayjs';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { Parameter, getParameterByName } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { toISODateString } from '@/utils/dateUtils';

/**
 * Helper function to get default value for a parameter at a specific date
 * Priority: 1) User's reform value, 2) Baseline current law value
 */
export function getDefaultValueForParam(
  param: ParameterMetadata,
  currentParameters: Parameter[],
  date: string
): any {
  // First check if user has set a reform value for this parameter
  const userParam = getParameterByName({ parameters: currentParameters } as any, param.parameter);
  if (userParam && userParam.values && userParam.values.length > 0) {
    const userCollection = new ValueIntervalCollection(userParam.values);
    const userValue = userCollection.getValueAtDate(date);
    if (userValue !== undefined) {
      return userValue;
    }
  }

  // Fall back to baseline current law value from metadata
  if (param.values) {
    const collection = new ValueIntervalCollection(param.values as any);
    const value = collection.getValueAtDate(date);
    if (value !== undefined) {
      return value;
    }
  }

  // Last resort: default based on unit type
  return param.unit === 'bool' ? false : 0;
}

/**
 * Create a date change handler that converts Date/string/null to ISO date string
 * @param setDate - State setter for the date
 * @returns Handler function for date picker onChange
 */
export function createDateChangeHandler(
  setDate: (date: string) => void
): (value: Date | string | null) => void {
  return (value: Date | string | null) => {
    setDate(toISODateString(value));
  };
}

/**
 * Create a date change handler that sets the date to end of year
 * @param setDate - State setter for the date
 * @returns Handler function for date picker onChange
 */
export function createEndOfYearDateChangeHandler(
  setDate: (date: string) => void
): (value: Date | string | null) => void {
  return (value: Date | string | null) => {
    const isoString = toISODateString(value);
    if (isoString) {
      const endOfYearDate = dayjs(isoString).endOf('year').format('YYYY-MM-DD');
      setDate(endOfYearDate);
    } else {
      setDate('');
    }
  };
}

/**
 * Calculate end of year for a given date string
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns End of year date in ISO format
 */
export function getEndOfYear(dateString: string): string {
  return dayjs(dateString).endOf('year').format('YYYY-MM-DD');
}

/**
 * Create a single value interval from date range and value
 * @param startDate - Start date in ISO format
 * @param endDate - End date in ISO format
 * @param value - Parameter value
 * @returns ValueInterval object or null if dates are invalid
 */
export function createSingleValueInterval(
  startDate: string,
  endDate: string,
  value: any
): ValueInterval | null {
  if (startDate && endDate) {
    return {
      startDate,
      endDate,
      value,
    };
  }
  return null;
}

/**
 * Create value intervals from a record of year -> value mappings
 * @param yearValues - Record mapping year (as string) to value
 * @returns Array of ValueInterval objects, one per year
 */
export function createMultiYearValueIntervals(
  yearValues: Record<string, any>
): ValueInterval[] {
  return Object.keys(yearValues).map((year: string) => ({
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    value: yearValues[year],
  }));
}

/**
 * Generate array of years from start year up to max date, limited by max count
 * @param maxDate - Maximum date in ISO format
 * @param maxYears - Maximum number of years to generate
 * @param startYear - Starting year (default: 2025)
 * @returns Array of year numbers
 */
export function generateYears(
  maxDate: string,
  maxYears: number,
  startYear: number = 2025
): number[] {
  const endYear = dayjs(maxDate).year();
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years.slice(0, maxYears);
}
