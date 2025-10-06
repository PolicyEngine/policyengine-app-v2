import moment from 'moment';

/**
 * Rigorous datetime handling utilities
 */

/**
 * Format a datetime string to "X time ago" with proper timezone handling
 * @param datetime - ISO datetime string from the API
 * @returns Human-readable relative time string
 */
export function timeAgo(datetime: string): string {
  // Parse as UTC and convert to local time
  const m = moment.utc(datetime).local();

  // Use fromNow for relative time
  return m.fromNow();
}

/**
 * Format a datetime string to absolute format
 * @param datetime - ISO datetime string from the API
 * @param format - Moment format string (default: "MMMM D, YYYY h:mm A")
 * @returns Formatted datetime string
 */
export function formatDateTime(datetime: string, format: string = "MMMM D, YYYY h:mm A"): string {
  // Parse as UTC and convert to local time
  const m = moment.utc(datetime).local();

  return m.format(format);
}

/**
 * Get the raw moment object for custom formatting
 * @param datetime - ISO datetime string from the API
 * @returns Moment object in local timezone
 */
export function getMoment(datetime: string): moment.Moment {
  return moment.utc(datetime).local();
}
