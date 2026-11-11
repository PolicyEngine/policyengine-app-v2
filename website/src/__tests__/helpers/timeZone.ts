import { afterAll, beforeAll } from "vitest";

/**
 * Time zone helpers for date tests. CI runs in UTC, where a bare date read as
 * UTC midnight still shows the right day, so date tests must set a zone
 * explicitly. Node applies a runtime change to `process.env.TZ` to `Date` and
 * `Intl` straight away.
 */

/** One zone west of UTC and one east of it, with their January offsets. */
export const READER_TIME_ZONES = [
  // UTC−8 in January: a bare date read as UTC midnight is the day before.
  { timeZone: "America/Los_Angeles", januaryOffsetMinutes: 480 },
  // UTC+13 in January: a local midnight read as UTC is the day before.
  { timeZone: "Pacific/Auckland", januaryOffsetMinutes: -780 },
] as const;

function setTimeZone(timeZone: string | undefined) {
  if (timeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = timeZone;
  }
}

/** Run the enclosing describe block with the process in `timeZone`. */
export function inTimeZone(timeZone: string) {
  let previous: string | undefined;
  beforeAll(() => {
    previous = process.env.TZ;
    setTimeZone(timeZone);
  });
  afterAll(() => setTimeZone(previous));
}

/** Run `fn` with the process in `timeZone`, then restore the previous zone. */
export function withTimeZone<T>(timeZone: string, fn: () => T): T {
  const previous = process.env.TZ;
  setTimeZone(timeZone);
  try {
    return fn();
  } finally {
    setTimeZone(previous);
  }
}
