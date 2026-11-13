import { cloneElement, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import {
  BlogChart,
  formatChartValue,
  niceTicks,
  parseBlogChartSpec,
} from "@/components/blog/BlogChart";

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
        width: 600,
        height: typeof height === "number" ? height : 240,
      }),
  };
});

const SPEC = {
  type: "line",
  title: "Income tax for a single pensioner, 2027-28",
  xKey: "income",
  xLabel: "Total income",
  series: [
    { key: "baseline", name: "Without the allowance", color: "quinary" },
    { key: "reform", name: "With the allowance", color: "primary" },
  ],
  data: [
    { income: 12000, baseline: 0, reform: 0 },
    { income: 12570, baseline: 0, reform: 0 },
    { income: 13036.4, baseline: 93.28, reform: 0 },
    { income: 13800, baseline: 246, reform: 246 },
  ],
  markers: [{ x: 12570, label: "Personal Allowance" }],
  format: { prefix: "£", decimals: 0, separator: true },
  xFormat: { prefix: "£", decimals: 0, separator: true },
  source: "PolicyEngine UK",
};

const parse = (spec: unknown) => parseBlogChartSpec(JSON.stringify(spec));

describe("line chart spec", () => {
  test("a valid spec parses as a line chart", () => {
    expect(parse(SPEC)?.type).toBe("line");
  });

  test("yIncludesZero false parses", () => {
    expect(parse({ ...SPEC, yIncludesZero: false })?.type).toBe("line");
  });

  test("a step series parses", () => {
    const spec = {
      ...SPEC,
      series: [{ key: "reform", name: "Rate", step: true }],
    };
    expect(parse(spec)?.type).toBe("line");
  });

  test.each([
    ["x values out of order", { data: [...SPEC.data].reverse() }],
    [
      "a row missing a series value",
      { data: [...SPEC.data.slice(0, 3), { income: 13800, baseline: 246 }] },
    ],
    [
      "a string x value",
      { data: [{ ...SPEC.data[0], income: "low" }, SPEC.data[1]] },
    ],
    ["one data row", { data: [SPEC.data[0]] }],
    ["a marker without a label", { markers: [{ x: 12570 }] }],
    [
      "a non-boolean step",
      { series: [{ key: "reform", name: "R", step: "yes" }] },
    ],
    ["a bad x format", { xFormat: { separator: "yes" } }],
    ["a bad x label", { xLabel: 3 }],
    ["a non-boolean yIncludesZero", { yIncludesZero: "no" }],
  ])("rejects %s", (_, override) => {
    expect(parse({ ...SPEC, ...override })).toBeNull();
  });
});

describe("line chart rendering", () => {
  test("renders the title, series names, marker label and source", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    expect(
      screen.getByText("Income tax for a single pensioner, 2027-28"),
    ).toBeInTheDocument();
    expect(screen.getByText("Without the allowance")).toBeInTheDocument();
    expect(screen.getByText("With the allowance")).toBeInTheDocument();
    expect(screen.getByText("Personal Allowance")).toBeInTheDocument();
    expect(screen.getByText("PolicyEngine UK")).toBeInTheDocument();
  });

  test("an invalid spec renders nothing", () => {
    const { container } = render(
      <BlogChart data={JSON.stringify({ ...SPEC, data: [] })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("chart helpers", () => {
  test("the separator groups thousands", () => {
    expect(
      formatChartValue(13036.4, { prefix: "£", decimals: 2, separator: true }),
    ).toBe("£13,036.40");
    expect(formatChartValue(-1234567, { decimals: 0, separator: true })).toBe(
      "−1,234,567",
    );
    expect(formatChartValue(999, { decimals: 0, separator: true })).toBe("999");
  });

  test("without the separator, values stay ungrouped", () => {
    expect(formatChartValue(13036, { decimals: 0 })).toBe("13036");
  });

  test("niceTicks can leave zero out of the range", () => {
    const axis = niceTicks([12000, 13800], 6, false);
    expect(axis.domain[0]).toBeGreaterThan(0);
    expect(axis.ticks[0]).toBeLessThanOrEqual(12000);
    expect(axis.ticks.at(-1)).toBeGreaterThanOrEqual(13800);
  });

  test("niceTicks includes zero by default", () => {
    expect(niceTicks([12000, 13800]).domain[0]).toBe(0);
  });
});
