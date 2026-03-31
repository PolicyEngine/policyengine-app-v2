import { describe, expect, test } from "vitest";
import { computeDayStatuses } from "../../lib/betterstack";

describe("computeDayStatuses", () => {
  test("marks days before monitor creation as no-data", () => {
    const [day] = computeDayStatuses(
      ["2026-03-01"],
      [],
      "2026-03-02T12:00:00Z",
    );

    expect(day).toEqual({
      date: "2026-03-01",
      status: "no-data",
      downtimeMinutes: 0,
    });
  });

  test("sums downtime across incidents on the same day", () => {
    const [day] = computeDayStatuses(
      ["2026-03-03"],
      [
        {
          attributes: {
            started_at: "2026-03-03T01:00:00Z",
            resolved_at: "2026-03-03T01:30:00Z",
          },
        },
        {
          attributes: {
            started_at: "2026-03-03T04:00:00Z",
            resolved_at: "2026-03-03T04:20:00Z",
          },
        },
      ],
      "2026-03-01T00:00:00Z",
    );

    expect(day.status).toBe("degraded");
    expect(day.downtimeMinutes).toBeCloseTo(50, 5);
  });

  test("uses the provided current time for unresolved incidents", () => {
    const [day] = computeDayStatuses(
      ["2026-03-04"],
      [
        {
          attributes: {
            started_at: "2026-03-04T00:00:00Z",
            resolved_at: null,
          },
        },
      ],
      "2026-03-01T00:00:00Z",
      new Date("2026-03-04T00:30:00Z").getTime(),
    );

    expect(day.status).toBe("degraded");
    expect(day.downtimeMinutes).toBeCloseTo(30, 5);
  });
});
