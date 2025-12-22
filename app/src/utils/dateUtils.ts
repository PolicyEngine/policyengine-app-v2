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
 * Convert a Date object or ISO string to YYYY-MM-DD format
 * Handles both Date objects from Mantine pickers and ISO strings
 * @param value - Date object, ISO string, or null
 * @returns ISO date string (YYYY-MM-DD) or empty string if null
 */
export function toISODateString(value: Date | string | null): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  } // Already ISO string
  return value.toISOString().split('T')[0];
}

/**
 * Convert ISO string to Date object for Mantine pickers
 * Returns undefined if empty string (Mantine pickers expect undefined, not null)
 * @param isoString - ISO date string (YYYY-MM-DD)
 * @returns Date object or undefined
 */
export function fromISODateString(isoString: string): Date | undefined {
  if (!isoString) {
    return undefined;
  }
  return new Date(isoString);
}

/**
 * Formats a date string using Intl.DateTimeFormat with UTC timezone
 * @param dateStr - ISO date string (e.g., "2023-01-01")
 * @param formatType - The desired format type
 * @param countryId - Country ID for locale formatting (must be explicitly provided)
 * @param stripTime - Whether to strip time component
 * @returns Formatted date string
 */
export function formatDate(
  dateStr: string,
  formatType: DateFormatType,
  countryId: (typeof countryIds)[number],
  stripTime: boolean = false
): string {
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

/**
 * Formats a timestamp for display in report output pages
 * Shows relative time (today) or absolute date with time
 * Uses country-specific locale formatting:
 * - US: "Ran Dec 17, 2025 at 2:34 PM"
 * - UK: "Ran 17 Dec 2025 at 14:34"
 * @param dateString - ISO date string or timestamp
 * @param countryId - Optional country ID for locale formatting ('uk' or 'us')
 * @returns Formatted timestamp string
 */
export function formatReportTimestamp(dateString?: string, countryId?: string): string {
  if (!dateString) {
    return 'Run date unknown';
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Run date unknown';
    }

    // Determine locale based on country
    const locale = countryId === 'uk' ? 'en-GB' : 'en-US';
    const use24Hour = countryId === 'uk';

    // Format date part: "Dec 17, 2025" (US) or "17 Dec 2025" (UK)
    const datePart = date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Format time part: "2:34 PM" (US) or "14:34" (UK)
    const timePart = date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !use24Hour,
    });

    return `Ran ${datePart} at ${timePart}`;
  } catch {
    return 'Run date unknown';
  }
}
