import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { countryIds } from '@/libs/countries';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EARLY_YEAR_CALENDAR_OFFSET = 2000;

interface ParsedISOCalendarDate {
  date: Dayjs;
  yearOffset: number;
}

/**
 * Parse a PolicyEngine calendar date without changing its four-digit year.
 *
 * Day.js inherits JavaScript's special handling of years 0000 through 0099.
 * PolicyEngine metadata uses those years as beginning-of-time effective dates,
 * so validate them against a Gregorian-equivalent year 2,000 years later. The
 * offset is a multiple of 400 and therefore preserves the Gregorian leap cycle.
 */
function parseISOCalendarDate(value: string): ParsedISOCalendarDate | undefined {
  if (!ISO_DATE_PATTERN.test(value)) {
    return undefined;
  }

  const year = Number(value.slice(0, 4));
  const yearOffset = year < 100 ? EARLY_YEAR_CALENDAR_OFFSET : 0;
  const parseableValue = `${String(year + yearOffset).padStart(4, '0')}${value.slice(4)}`;
  const date = dayjs.utc(parseableValue, ISO_DATE_FORMAT, true);

  return date.isValid() ? { date, yearOffset } : undefined;
}

function formatISOCalendarDate(date: Dayjs, yearOffset: number): string {
  const year = date.year() - yearOffset;

  if (year < 0 || year > 9999) {
    throw new Error('Shifted ISO date is outside the supported four-digit year range');
  }

  return `${String(year).padStart(4, '0')}-${date.format('MM-DD')}`;
}

/** Whether a string represents a real Gregorian calendar date in YYYY-MM-DD format. */
export function isValidISODateString(value: string): boolean {
  return parseISOCalendarDate(value) !== undefined;
}

/** Compare two canonical YYYY-MM-DD strings without converting them to instants. */
export function compareISODateStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

/**
 * Move a canonical calendar date by whole days and return another date-only string.
 * The UTC-backed Day.js object is confined to this function and never enters app state.
 */
export function shiftISODate(value: string, days: number): string {
  const parsed = parseISOCalendarDate(value);

  if (!parsed) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  return formatISOCalendarDate(parsed.date.add(days, 'day'), parsed.yearOffset);
}

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
 * Convert a Date object to ISO date string (YYYY-MM-DD) in UTC
 * Use for API calls, data storage, and serialization
 * WARNING: Do not use for UI date pickers - use toLocalDateString instead
 * @param value - Date object, ISO string, or null
 * @returns ISO date string (YYYY-MM-DD) in UTC, or empty string if null
 */
export function toISODateString(value: Date | string | null): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return value.toISOString().split('T')[0];
}

/**
 * Convert ISO date string to Date object (interprets as UTC)
 * Use for API responses and stored data
 * WARNING: Do not use for UI date pickers - use fromLocalDateString instead
 * @param isoString - ISO date string (YYYY-MM-DD)
 * @returns Date object (UTC interpretation), or undefined
 */
export function fromISODateString(isoString: string): Date | undefined {
  if (!isoString) {
    return undefined;
  }
  return new Date(isoString);
}

/**
 * Convert a Date object to date string (YYYY-MM-DD) in local timezone
 * Use for UI components like Mantine date pickers
 * @param value - Date object, date string, or null
 * @returns Date string (YYYY-MM-DD) in local time, or empty string if null
 */
export function toLocalDateString(value: Date | string | null): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return dayjs(value).format('YYYY-MM-DD');
}

/**
 * Convert date string to Date object in local timezone
 * Use for UI components like Mantine date pickers
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Date object in local time, or undefined
 */
export function fromLocalDateString(dateString: string): Date | undefined {
  if (!dateString) {
    return undefined;
  }
  return dayjs(dateString).toDate();
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
    return 'Ran recently';
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

/**
 * Formats a date period (start to end) with smart formatting:
 * - If endDate is FOREVER (2100-12-31), shows formatted start date + " onward"
 * - If start is Jan 1 and end is Dec 31 (any years), shows "XXXX" or "XXXX - YYYY"
 * - Otherwise shows full dates "MMM D, YYYY - MMM D, YYYY"
 *
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param endDate - ISO date string (YYYY-MM-DD)
 * @returns Formatted period string
 */
export function formatPeriod(startDate: string, endDate: string): string {
  const FOREVER = '2100-12-31';

  // Handle missing or invalid dates
  const parsedStartDate = parseISOCalendarDate(startDate);
  const parsedEndDate = parseISOCalendarDate(endDate);
  if (!parsedStartDate || !parsedEndDate) {
    return '—';
  }

  // Extract year, month, day from dates
  const startParts = startDate.split('-');
  const endParts = endDate.split('-');

  const [startYear, startMonth, startDay] = startParts;
  const [endYear, endMonth, endDay] = endParts;

  // Helper to format a single date
  const formatFullDate = (parsedDate: ParsedISOCalendarDate, year: string): string => {
    return `${parsedDate.date.format('MMM D')}, ${year}`;
  };

  // Check for "onward" case (FOREVER end date)
  if (endDate === FOREVER) {
    // If start is Jan 1, just show "YYYY onward"
    if (startMonth === '01' && startDay === '01') {
      return `${startYear} onward`;
    }
    // Otherwise show full start date + onward
    return `${formatFullDate(parsedStartDate, startYear)} onward`;
  }

  // Check for year-aligned case (Jan 1 to Dec 31)
  if (startMonth === '01' && startDay === '01' && endMonth === '12' && endDay === '31') {
    // Same year: just show "YYYY"
    if (startYear === endYear) {
      return startYear;
    }
    // Different years: show "XXXX - YYYY"
    return `${startYear} - ${endYear}`;
  }

  // Default: format as full date range
  return `${formatFullDate(parsedStartDate, startYear)} - ${formatFullDate(
    parsedEndDate,
    endYear
  )}`;
}
