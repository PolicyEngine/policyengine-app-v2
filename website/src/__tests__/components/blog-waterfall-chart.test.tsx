import { cloneElement, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, test, vi } from "vitest";

import { BlogChart, parseBlogChartSpec } from "@/components/blog/BlogChart";
import {
  type BlogWaterfallSpec,
  buildWaterfallPanels,
  parseWaterfallSpec,
} from "@/components/blog/BlogWaterfallChart";

// jsdom has no layout, so give the responsive container a fixed size.
vi.mock("recharts", async (importOriginal) => {
  const mod = await importOriginal<typeof import("recharts")>();
  return {
    ...mod,
    ResponsiveContainer: ({
      children,
      height,
    }: {
      children: ReactElement<{ width?: number; height?: number }>;
      height?: number | string;
    }) =>
      cloneElement(children, {
        width: 400,
        height: typeof height === "number" ? height : 240,
      }),
  };
});

const SPEC = {
  type: "waterfall",
  title: "SPM poverty, 2024 to 2025",
  panelKey: "group",
  steps: [
    {
      key: "y2024",
      name: "2024",
      kind: "level",
      legend: "Published rate",
      color: "primary",
    },
    {
      key: "resources",
      name: "Resources",
      kind: "change",
      legend: "Resources",
      color: "quinary",
    },
    {
      key: "thresholds",
      name: "Thresholds",
      kind: "change",
      legend: "Thresholds",
      color: "tertiary",
    },
    {
      key: "y2025",
      name: "2025",
      kind: "level",
      legend: "Published rate",
      color: "primary",
    },
  ],
  data: [
    {
      group: "All people",
      y2024: 13.0,
      resources: -0.6911,
      thresholds: 0.8028,
      y2025: 13.1117,
    },
    {
      group: "Under 18",
      y2024: 13.5,
      resources: -1.194,
      thresholds: 1.0853,
      y2025: 13.3913,
    },
  ],
  format: { decimals: 1 },
  source: "Source: test fixture.",
};

const parse = (spec: unknown) =>
  parseWaterfallSpec(JSON.parse(JSON.stringify(spec)));

describe("parseWaterfallSpec", () => {
  test("accepts a valid spec, through the chart dispatcher too", () => {
    expect(parse(SPEC)?.steps).toHaveLength(4);
    expect(parseBlogChartSpec(JSON.stringify(SPEC))?.type).toBe("waterfall");
  });

  test("rejects malformed specs", () => {
    const row = SPEC.data[0];
    expect(parse({ ...SPEC, panelKey: 1 })).toBeNull();
    expect(parse({ ...SPEC, steps: SPEC.steps.slice(0, 1) })).toBeNull();
    expect(
      parse({ ...SPEC, steps: [{ ...SPEC.steps[0], kind: "total" }] }),
    ).toBeNull();
    expect(
      parse({ ...SPEC, steps: [...SPEC.steps.slice(1), { key: "x" }] }),
    ).toBeNull();
    expect(parse({ ...SPEC, data: [] })).toBeNull();
    expect(parse({ ...SPEC, data: [{ ...row, group: 3 }] })).toBeNull();
    expect(
      parse({ ...SPEC, data: [{ ...row, resources: "-0.7" }] }),
    ).toBeNull();
    const missing: Record<string, unknown> = { ...row };
    delete missing.thresholds;
    expect(parse({ ...SPEC, data: [missing] })).toBeNull();
  });

  test("rejects a later level that does not equal the running total", () => {
    expect(
      parse({ ...SPEC, data: [{ ...SPEC.data[0], y2025: 13.2 }] }),
    ).toBeNull();
  });
});

describe("buildWaterfallPanels", () => {
  test("stacks each step on the running total", () => {
    const [all] = buildWaterfallPanels(parse(SPEC) as BlogWaterfallSpec);
    expect(all.title).toBe("All people");
    const ranges = all.bars.map((b) => b.range);
    expect(ranges[0]).toEqual([0, 13]);
    expect(ranges[1][0]).toBeCloseTo(12.3089, 10);
    expect(ranges[1][1]).toBeCloseTo(13, 10);
    expect(ranges[2][0]).toBeCloseTo(12.3089, 10);
    expect(ranges[2][1]).toBeCloseTo(13.1117, 10);
    expect(ranges[3][0]).toBe(0);
    expect(ranges[3][1]).toBeCloseTo(13.1117, 10);
    expect(all.bars.map((b) => b.display)).toEqual([
      13, -0.6911, 0.8028, 13.1117,
    ]);
  });

  // Invariants for any sequence of steps whose later levels equal the running
  // total: the spec parses; every bar has non-negative height; a change bar
  // spans the running totals before and after it; a level bar spans zero to
  // the level; and moving a later level off the running total rejects the spec.
  const stepsArb = fc
    .tuple(
      fc.double({ min: -1000, max: 1000, noNaN: true }),
      fc.array(
        fc.oneof(
          fc.record({
            kind: fc.constant("change" as const),
            value: fc.double({ min: -1000, max: 1000, noNaN: true }),
          }),
          fc.constant({ kind: "level" as const, value: 0 }),
        ),
        { minLength: 1, maxLength: 8 },
      ),
    )
    .map(([first, rest]) => {
      let running = first;
      const steps: { kind: "level" | "change"; value: number }[] = [
        { kind: "level", value: first },
      ];
      for (const step of rest) {
        if (step.kind === "change") running += step.value;
        steps.push({
          kind: step.kind,
          value: step.kind === "change" ? step.value : running,
        });
      }
      return steps;
    });

  const specFor = (steps: { kind: "level" | "change"; value: number }[]) => ({
    type: "waterfall",
    panelKey: "panel",
    steps: steps.map((s, i) => ({ key: `s${i}`, name: `S${i}`, kind: s.kind })),
    data: [
      Object.fromEntries([
        ["panel", "P"],
        ...steps.map((s, i) => [`s${i}`, s.value]),
      ]),
    ],
  });

  test("bars follow the running total for any consistent sequence", () => {
    fc.assert(
      fc.property(stepsArb, (steps) => {
        const spec = parse(specFor(steps));
        expect(spec).not.toBeNull();
        const [panel] = buildWaterfallPanels(spec as BlogWaterfallSpec);
        let running = 0;
        panel.bars.forEach((bar, i) => {
          expect(bar.barHeight).toBeGreaterThanOrEqual(0);
          expect(bar.barHeight).toBeCloseTo(bar.range[1] - bar.range[0], 6);
          const step = steps[i];
          if (step.kind === "change") {
            const end = running + step.value;
            expect(bar.range[0]).toBeCloseTo(Math.min(running, end), 6);
            expect(bar.range[1]).toBeCloseTo(Math.max(running, end), 6);
            running = end;
          } else {
            running = i === 0 ? step.value : running;
            expect(bar.range[0]).toBeCloseTo(Math.min(0, running), 6);
            expect(bar.range[1]).toBeCloseTo(Math.max(0, running), 6);
          }
        });
      }),
    );
  });

  test("a later level moved off the running total is rejected", () => {
    fc.assert(
      fc.property(
        stepsArb.filter((steps) =>
          steps.some((s, i) => i > 0 && s.kind === "level"),
        ),
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        (steps, shift) => {
          const i = steps.findIndex((s, j) => j > 0 && s.kind === "level");
          const moved = steps.map((s, j) =>
            j === i ? { ...s, value: s.value + shift } : s,
          );
          expect(parse(specFor(moved))).toBeNull();
        },
      ),
    );
  });
});

describe("BlogChart waterfall", () => {
  test("renders panels, signed labels, connectors and a deduplicated legend", () => {
    const { container } = render(<BlogChart data={JSON.stringify(SPEC)} />);
    expect(screen.getByText(SPEC.title)).toBeInTheDocument();
    expect(screen.getByText("All people")).toBeInTheDocument();
    expect(screen.getByText("Under 18")).toBeInTheDocument();
    const labels = [...container.querySelectorAll("svg text")].map(
      (t) => t.textContent,
    );
    for (const label of [
      "13.0",
      "−0.7",
      "+0.8",
      "13.1",
      "13.5",
      "−1.2",
      "+1.1",
      "13.4",
    ]) {
      expect(labels).toContain(label);
    }
    // Three connectors per panel, between four bars.
    expect(
      container.querySelectorAll(
        'line[stroke="var(--border-dark)"][stroke-dasharray="3 3"]',
      ),
    ).toHaveLength(6);
    const legend = [...container.querySelectorAll("li")].map(
      (li) => li.textContent,
    );
    expect(legend).toEqual(["Published rate", "Resources", "Thresholds"]);
    expect(screen.getByText(SPEC.source)).toBeInTheDocument();
  });
});
