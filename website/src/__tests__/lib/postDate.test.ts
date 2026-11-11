import fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  READER_TIME_ZONES,
  inTimeZone,
  withTimeZone,
} from "@/__tests__/helpers/timeZone";
import appsData from "@/data/apps.json";
import postsData from "@/data/posts/posts.json";
import {
  formatPostDate,
  parsePostDate,
  toPostIsoDate,
  type PostDateParts,
} from "@/lib/postDate";

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/** The pre-fix formatter used by the article page and research list. */
function legacyFormat(value: string, month: "long" | "short"): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
}

/** What a reader should see for a calendar date, spelled out independently. */
function expectedLongDate({ year, month, day }: PostDateParts): string {
  return `${LONG_MONTHS[month - 1]} ${day}, ${year}`;
}

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one. Only used for
  // years 1000 to 9999, where Date.UTC's two-digit-year mapping cannot apply.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Arbitrary valid calendar dates, as fields. */
const calendarDate = fc
  .record({
    year: fc.integer({ min: 1000, max: 9999 }),
    month: fc.integer({ min: 1, max: 12 }),
    dayIndex: fc.nat(),
  })
  .map(({ year, month, dayIndex }) => ({
    year,
    month,
    day: (dayIndex % daysInMonth(year, month)) + 1,
  }));

const clockTime = fc.record({
  hour: fc.integer({ min: 0, max: 23 }),
  minute: fc.integer({ min: 0, max: 59 }),
  second: fc.integer({ min: 0, max: 59 }),
});

function bareDate({ year, month, day }: PostDateParts): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** Arbitrary zone-less post dates in every accepted shape. */
const zonelessPostDate = fc
  .tuple(
    calendarDate,
    fc.option(clockTime, { nil: undefined }),
    fc.constantFrom(" ", "T"),
    fc.boolean(),
  )
  .map(([date, time, separator, withSeconds]) => {
    if (!time) return { value: bareDate(date), date };
    const clock = withSeconds
      ? `${pad(time.hour)}:${pad(time.minute)}:${pad(time.second)}`
      : `${pad(time.hour)}:${pad(time.minute)}`;
    return { value: `${bareDate(date)}${separator}${clock}`, date };
  });

// Offsets from UTC−12 to UTC+14, including half- and quarter-hour zones.
const READER_ZONES = [
  "UTC",
  "Etc/GMT+12",
  "Pacific/Pago_Pago",
  "America/Los_Angeles",
  "America/New_York",
  "America/St_Johns",
  "Europe/London",
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Pacific/Chatham",
  "Pacific/Kiritimati",
];

const postDates = (postsData as { date: string }[]).map((post) => post.date);
const appDates = (appsData as { date?: string }[])
  .map((app) => app.date)
  .filter((date): date is string => date !== undefined);

describe.each(READER_TIME_ZONES)(
  "formatPostDate with TZ=$timeZone",
  ({ timeZone, januaryOffsetMinutes }) => {
    inTimeZone(timeZone);

    test("given the zone is set then Date uses it", () => {
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(timeZone);
      expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(
        januaryOffsetMinutes,
      );
      // `new Date` reads a bare date as UTC midnight: the day before in Los
      // Angeles, the same day in Auckland.
      expect(new Date("2026-06-16").getDate()).toBe(
        timeZone === "America/Los_Angeles" ? 15 : 16,
      );
    });

    test("given a bare date then it displays as that calendar day", () => {
      expect(formatPostDate("2026-06-16")).toBe("June 16, 2026");
      expect(formatPostDate("2026-06-16", "long")).toBe("June 16, 2026");
      expect(formatPostDate("2026-06-16", "short")).toBe("Jun 16, 2026");
      expect(formatPostDate("2026-01-01", "short")).toBe("Jan 1, 2026");
      expect(formatPostDate("2025-12-31", "long")).toBe("December 31, 2025");
      expect(formatPostDate("2024-02-29", "long")).toBe("February 29, 2024");
    });

    test("given a timestamp then it displays as before", () => {
      expect(formatPostDate("2026-09-29 08:00:00")).toBe("September 29, 2026");
      expect(formatPostDate("2026-09-29 23:59:59", "short")).toBe(
        "Sep 29, 2026",
      );
      expect(formatPostDate("2026-09-29 00:00:00", "short")).toBe(
        "Sep 29, 2026",
      );
      expect(formatPostDate("2023-11-22 17:25")).toBe("November 22, 2023");
    });

    test("given every date in posts.json and apps.json then each displays as its own calendar day", () => {
      for (const value of [...postDates, ...appDates]) {
        const parts = parsePostDate(value);
        expect(parts, value).not.toBeNull();
        expect(formatPostDate(value, "long"), value).toBe(
          expectedLongDate(parts!),
        );
      }
    });

    test("given every timestamp in posts.json and apps.json then the display matches the previous formatter", () => {
      const timestamps = [...postDates, ...appDates].filter(
        (value) => parsePostDate(value)?.time,
      );
      expect(timestamps.length).toBeGreaterThan(0);
      for (const value of timestamps) {
        for (const month of ["long", "short"] as const) {
          expect(formatPostDate(value, month), value).toBe(
            legacyFormat(value, month),
          );
        }
      }
    });

    test("given any zone-less post date then it displays as the calendar day it names", () => {
      fc.assert(
        fc.property(zonelessPostDate, ({ value, date }) => {
          expect(formatPostDate(value, "long")).toBe(expectedLongDate(date));
        }),
      );
    });

    test("given any zone-less timestamp then the display matches the previous formatter", () => {
      // Years after 1900 keep clear of local mean time; neither zone has
      // skipped a calendar day since.
      const modernTimestamp = zonelessPostDate.filter(
        ({ value, date }) => value.length > 10 && date.year >= 1900,
      );
      fc.assert(
        fc.property(
          modernTimestamp,
          fc.constantFrom("long", "short") as fc.Arbitrary<"long" | "short">,
          ({ value }, month) => {
            expect(formatPostDate(value, month)).toBe(
              legacyFormat(value, month),
            );
          },
        ),
      );
    });

    test("given a timestamp with an offset then it keeps the reader's local day", () => {
      const value = "2026-06-16T02:00:00Z";
      expect(formatPostDate(value)).toBe(legacyFormat(value, "long"));
      expect(formatPostDate(value)).toBe(
        timeZone === "America/Los_Angeles" ? "June 15, 2026" : "June 16, 2026",
      );
    });
  },
);

describe("formatPostDate across zones", () => {
  test("given any zone-less post date then every zone shows the same text", () => {
    fc.assert(
      fc.property(
        zonelessPostDate,
        fc.constantFrom(...READER_ZONES),
        fc.constantFrom("long", "short") as fc.Arbitrary<"long" | "short">,
        ({ value }, timeZone, month) => {
          const inUtc = withTimeZone("UTC", () => formatPostDate(value, month));
          const inZone = withTimeZone(timeZone, () =>
            formatPostDate(value, month),
          );
          expect(inZone).toBe(inUtc);
        },
      ),
    );
  });

  test("given a day the reader's zone skipped then it still shows that day", () => {
    // Samoa moved across the date line and skipped 30 December 2011, so local
    // noon on that day does not exist there. Formatting from the fields still
    // names the day the post was dated.
    withTimeZone("Pacific/Apia", () => {
      expect(formatPostDate("2011-12-30")).toBe("December 30, 2011");
    });
  });

  test("given a string that is not a date then it is returned unchanged", () => {
    expect(formatPostDate("not a date")).toBe("not a date");
    expect(formatPostDate("")).toBe("");
  });
});

describe("parsePostDate", () => {
  test("given a bare date then it returns the calendar fields", () => {
    expect(parsePostDate("2026-06-16")).toEqual({
      year: 2026,
      month: 6,
      day: 16,
    });
  });

  test("given a timestamp then it returns the fields and the time", () => {
    expect(parsePostDate("2026-09-29 08:00:00")).toEqual({
      year: 2026,
      month: 9,
      day: 29,
      time: { hour: 8, minute: 0, second: 0 },
    });
    expect(parsePostDate("2023-11-22 17:25")).toEqual({
      year: 2023,
      month: 11,
      day: 22,
      time: { hour: 17, minute: 25, second: 0 },
    });
    expect(parsePostDate("2026-09-29T08:00:00")).toEqual({
      year: 2026,
      month: 9,
      day: 29,
      time: { hour: 8, minute: 0, second: 0 },
    });
  });

  test.each([
    "2026-02-29",
    "2100-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-06-00",
    "2026-06-16 24:00:00",
    "2026-06-16 12:60:00",
    "2026-06-16 12:00:60",
    "2026-6-16",
    "26-06-16",
    "2026-06-16T08:00:00Z",
    "2026-06-16T08:00:00-04:00",
    "2026-06-16 08:00:00.000",
    " 2026-06-16",
    "June 16, 2026",
  ])("given %j then it returns null", (value) => {
    expect(parsePostDate(value)).toBeNull();
  });

  test("given leap days then only real ones parse", () => {
    expect(parsePostDate("2024-02-29")).not.toBeNull();
    expect(parsePostDate("2000-02-29")).not.toBeNull();
    expect(parsePostDate("1900-02-29")).toBeNull();
  });

  test("given any valid zone-less post date then it round-trips its fields", () => {
    fc.assert(
      fc.property(zonelessPostDate, ({ value, date }) => {
        const parts = parsePostDate(value);
        expect(parts).not.toBeNull();
        expect({
          year: parts!.year,
          month: parts!.month,
          day: parts!.day,
        }).toEqual(date);
      }),
    );
  });
});

describe("toPostIsoDate", () => {
  test("given a bare date then it is already ISO 8601", () => {
    expect(toPostIsoDate("2026-06-16")).toBe("2026-06-16");
    expect(toPostIsoDate("2026-06-16", "date")).toBe("2026-06-16");
  });

  test("given a timestamp then it uses the ISO 8601 T separator", () => {
    expect(toPostIsoDate("2026-09-29 08:00:00")).toBe("2026-09-29T08:00:00");
    expect(toPostIsoDate("2023-11-22 17:25")).toBe("2023-11-22T17:25:00");
    expect(toPostIsoDate("2026-09-29 08:00:00", "date")).toBe("2026-09-29");
  });

  test("given a string that is not a zone-less post date then it is unchanged", () => {
    expect(toPostIsoDate("2026-09-29T08:00:00-04:00")).toBe(
      "2026-09-29T08:00:00-04:00",
    );
    expect(toPostIsoDate("2026-09-29T08:00:00Z", "date")).toBe(
      "2026-09-29T08:00:00Z",
    );
    expect(toPostIsoDate("not a date")).toBe("not a date");
  });

  test("given any zone-less post date then the output is ISO 8601, idempotent and names the same day", () => {
    fc.assert(
      fc.property(zonelessPostDate, ({ value, date }) => {
        const iso = toPostIsoDate(value);
        const isoDate = toPostIsoDate(value, "date");
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/);
        expect(isoDate).toBe(bareDate(date));
        expect(toPostIsoDate(iso)).toBe(iso);
        expect(parsePostDate(iso)).toEqual(parsePostDate(value));
      }),
    );
  });
});

describe("post and app dates", () => {
  // The research list sorts dates as strings, which only matches time order
  // for zone-less dates, so every entry must be one.
  test("given posts.json then every date is a valid zone-less post date", () => {
    const invalid = postDates.filter((value) => !parsePostDate(value));
    expect(invalid).toEqual([]);
  });

  test("given apps.json then every date that is set is a valid zone-less post date", () => {
    const invalid = appDates.filter((value) => !parsePostDate(value));
    expect(invalid).toEqual([]);
  });

  test("given posts.json then it still has both bare dates and timestamps", () => {
    expect(postDates.some((value) => !parsePostDate(value)?.time)).toBe(true);
    expect(postDates.some((value) => parsePostDate(value)?.time)).toBe(true);
  });
});
