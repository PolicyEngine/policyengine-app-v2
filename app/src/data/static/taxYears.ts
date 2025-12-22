/**
 * Tax year utilities
 * Provides formatted tax year data from static time periods
 */

import { getTimePeriods } from './timePeriods';

/**
 * Get tax years formatted for Select components
 *
 * @param countryId - Country code ('us' or 'uk')
 * @returns Array of { value: string, label: string } sorted by year ascending
 */
export function getTaxYears(countryId: string): Array<{ value: string; label: string }> {
  const timePeriods = getTimePeriods(countryId);

  return timePeriods
    .map((tp) => ({
      value: tp.name.toString(),
      label: tp.label,
    }))
    .sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
}

/**
 * Get min/max date range from available time periods
 *
 * @param countryId - Country code ('us' or 'uk')
 * @returns Object with minDate and maxDate in YYYY-MM-DD format
 */
export function getDateRange(countryId: string): { minDate: string; maxDate: string } {
  const timePeriods = getTimePeriods(countryId);

  if (timePeriods.length === 0) {
    return {
      minDate: '2022-01-01',
      maxDate: '2035-12-31',
    };
  }

  const possibleYears = timePeriods.map((period) => period.name).sort();

  return {
    minDate: `${possibleYears[0]}-01-01`,
    maxDate: `${possibleYears[possibleYears.length - 1]}-12-31`,
  };
}
