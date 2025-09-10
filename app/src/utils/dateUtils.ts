import { countryIds } from '@/libs/countries';

/**
 * Date formatting types available for use across the application
 */
export type DateFormatType =
  | 'short-month-day-year' // e.g., "Jan 1, 2023"
  | 'full-date' // e.g., "January 1, 2023"
  | 'numeric-date' // e.g., "1/1/2023"
  | 'iso-date' // e.g., "2023-01-01"
  | 'year-only'; // e.g., "2023"

/**
 * Formats a date string using Intl.DateTimeFormat with UTC timezone
 * @param dateStr - ISO date string (e.g., "2023-01-01")
 * @param formatType - The desired format type
 * @returns Formatted date string
 */
export function formatDate(
  dateStr: string,
  formatType: DateFormatType,
  countryId: (typeof countryIds)[number] = 'us',
  stripTime: boolean = false
): string {
  console.log('Formatting date:', dateStr, 'with format type:', formatType);
  // Ensure UTC interpretation by appending timezone
  // const date = new Date(`${dateStr}T00:00:00.000Z`);

  const date = new Date(dateStr);

  if (stripTime) {
    date.setUTCHours(0, 0, 0, 0);
  }

  const formatOptions = getFormatOptions(formatType);

  return new Intl.DateTimeFormat(`en-${countryId.toUpperCase()}`, {
    ...formatOptions,
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Gets the Intl.DateTimeFormat options for a given format type
 * @param formatType - The desired format type
 * @returns DateTimeFormat options
 */
function getFormatOptions(formatType: DateFormatType): Intl.DateTimeFormatOptions {
  switch (formatType) {
    case 'short-month-day-year':
      return {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
    case 'full-date':
      return {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
    case 'numeric-date':
      return {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      };
    case 'iso-date':
      return {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
    case 'year-only':
      return {
        year: 'numeric',
      };
    default:
      return {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
  }
}
