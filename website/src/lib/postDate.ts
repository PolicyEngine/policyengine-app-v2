/**
 * Publication dates for research posts and apps (`posts.json`, `apps.json`).
 *
 * Entries give either a bare calendar date ("2026-06-16") or a timestamp with
 * no time zone ("2026-09-29 08:00:00"). Either way, the date part is the day
 * the piece was published. `new Date("2026-06-16")` reads a bare date as UTC
 * midnight, so formatting it in a zone west of UTC shows the day before.
 *
 * These helpers read the year, month and day from the string and format them
 * in UTC. The day shown therefore never depends on the reader's time zone or
 * the build machine's, and the server-rendered text matches what the browser
 * renders on hydration.
 */

export type PostDateMonthStyle = "long" | "short";

export interface PostDateParts {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  /** Set when the entry is a timestamp rather than a bare date. */
  time?: { hour: number; minute: number; second: number };
}

// "YYYY-MM-DD", optionally followed by " HH:MM", " HH:MM:SS" or the same with
// a "T" separator. No offset or "Z": a string with one names an instant, not a
// calendar day, and is left to `new Date`.
const ZONELESS_POST_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(year: number, month: number): number {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return month === 2 && isLeapYear ? 29 : DAYS_IN_MONTH[month - 1];
}

/**
 * Parse a zone-less post date into its fields. Returns null for anything else:
 * a string with an offset, a malformed string, or an impossible date such as
 * "2026-02-30".
 */
export function parsePostDate(value: string): PostDateParts | null {
  const match = ZONELESS_POST_DATE.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  if (hourText === undefined) return { year, month, day };

  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = secondText === undefined ? 0 : Number(secondText);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return { year, month, day, time: { hour, minute, second } };
}

const utcFormatters = new Map<PostDateMonthStyle, Intl.DateTimeFormat>();

function utcFormatter(month: PostDateMonthStyle): Intl.DateTimeFormat {
  let formatter = utcFormatters.get(month);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month,
      day: "numeric",
      timeZone: "UTC",
    });
    utcFormatters.set(month, formatter);
  }
  return formatter;
}

/**
 * Format a post date for display, e.g. "June 16, 2026" or "Jun 16, 2026".
 *
 * A zone-less date or timestamp shows the calendar day it names, in every
 * time zone. A string with an explicit offset keeps the previous behavior and
 * shows the reader's local day for that instant. A string that is not a date
 * is returned unchanged rather than as "Invalid Date".
 */
export function formatPostDate(
  value: string,
  month: PostDateMonthStyle = "long",
): string {
  const parts = parsePostDate(value);
  if (parts) {
    // setUTCFullYear, unlike Date.UTC, does not map years 0 to 99 to 1900s.
    const date = new Date(0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    return utcFormatter(month).format(date);
  }

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return value;
  return instant.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/**
 * Convert a post date to ISO 8601 for machine-readable output.
 *
 * With `"datetime"` precision (for JSON-LD `datePublished` and Open Graph
 * `article:published_time`), a bare date stays "YYYY-MM-DD" and a timestamp
 * becomes "YYYY-MM-DDTHH:MM:SS". With `"date"` precision (for sitemap
 * `lastmod`, where a time needs an offset the data does not carry), the result
 * is always "YYYY-MM-DD". A string that is not a zone-less post date, such as
 * one with an explicit offset, is returned unchanged.
 */
export function toPostIsoDate(
  value: string,
  precision: "date" | "datetime" = "datetime",
): string {
  const parts = parsePostDate(value);
  if (!parts) return value;

  const date = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
  if (precision === "date" || !parts.time) return date;

  const { hour, minute, second } = parts.time;
  return `${date}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
}
