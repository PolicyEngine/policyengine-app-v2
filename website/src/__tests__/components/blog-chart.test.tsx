import { cloneElement, type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import {
  BlogChart,
  formatChartValue,
  parseBlogChartSpec,
} from "@/components/blog/BlogChart";
import { MarkdownFormatter } from "@/components/blog/MarkdownFormatter";
import { chartColor } from "@/components/blog/blogChartUtils";

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
        height: typeof height === "number" ? height : 360,
      }),
  };
});

const SPEC = {
  type: "bar",
  title: "Change in SPM poverty rate, 2024 to 2025",
  xKey: "group",
  series: [
    { key: "census", name: "Census", color: "quinary" },
    { key: "registered", name: "PolicyEngine prediction", color: "primary" },
  ],
  data: [
    { group: "All people", census: 0.07, registered: 0.22 },
    { group: "Under 18", census: -0.06, registered: 0.86 },
  ],
  format: { decimals: 2, suffix: " pp", signed: true },
  source: "Sources: Census P60-290 Table 5.",
};

describe("formatChartValue", () => {
  test("signs, decimals and suffix", () => {
    expect(
      formatChartValue(0.22, { decimals: 2, suffix: " pp", signed: true }),
    ).toBe("+0.22 pp");
    expect(
      formatChartValue(-0.06, { decimals: 2, suffix: " pp", signed: true }),
    ).toBe("−0.06 pp");
    expect(formatChartValue(13.1, { decimals: 1, suffix: "%" })).toBe("13.1%");
  });

  test("never prints a sign on a value that rounds to zero", () => {
    expect(formatChartValue(-0.001, { decimals: 2, signed: true })).toBe(
      "0.00",
    );
    expect(formatChartValue(0.004, { decimals: 2, signed: true })).toBe("0.00");
  });

  test("the printed sign and magnitude agree with the value for every input", () => {
    // Deterministic sweep in place of a property-based generator.
    for (let i = -2000; i <= 2000; i += 7) {
      const v = i / 173;
      for (const decimals of [0, 1, 2]) {
        const out = formatChartValue(v, { decimals, signed: true });
        const parsed = Number(out.replace("−", "-").replace("+", ""));
        expect(parsed).toBeCloseTo(Number(v.toFixed(decimals)), decimals);
        if (parsed > 0) expect(out.startsWith("+")).toBe(true);
        if (parsed < 0) expect(out.startsWith("−")).toBe(true);
        if (parsed === 0) expect(/^[+−]/.test(out)).toBe(false);
      }
    }
  });
});

describe("parseBlogChartSpec", () => {
  test("accepts a valid bar spec", () => {
    const spec = parseBlogChartSpec(JSON.stringify(SPEC));
    expect(spec?.type).toBe("bar");
    expect(spec?.type === "bar" && spec.series).toHaveLength(2);
  });

  test("rejects malformed or incomplete specs", () => {
    expect(parseBlogChartSpec("{not json")).toBeNull();
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, type: "pie" })),
    ).toBeNull();
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, series: [] })),
    ).toBeNull();
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, data: [] })),
    ).toBeNull();
    expect(parseBlogChartSpec(JSON.stringify({ ...SPEC, xKey: 3 }))).toBeNull();
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, series: [{ key: "a" }] })),
    ).toBeNull();
  });

  // A spec that parses must render: these would otherwise throw in toFixed or
  // in React, taking the whole article down rather than just the chart.
  test("rejects shared fields and rows that would throw during render", () => {
    const bad = [
      { ...SPEC, format: { decimals: 101 } },
      { ...SPEC, format: { decimals: -1 } },
      { ...SPEC, format: { decimals: 1.5 } },
      { ...SPEC, format: { suffix: 3 } },
      { ...SPEC, format: "pp" },
      { ...SPEC, title: { text: "x" } },
      { ...SPEC, source: 7 },
      { ...SPEC, height: -10 },
      { ...SPEC, data: [null] },
      { ...SPEC, data: [{ group: "All people", census: "0.07" }] },
      { ...SPEC, data: [{ group: {}, census: 0.07 }] },
    ];
    for (const spec of bad) {
      expect(parseBlogChartSpec(JSON.stringify(spec))).toBeNull();
    }
    expect(
      parseBlogChartSpec(
        JSON.stringify({ ...SPEC, data: [{ group: "All people" }] }),
      ),
    ).not.toBeNull();
  });
});

describe("chartColor", () => {
  test("resolves chart tokens and falls back to the series palette", () => {
    expect(chartColor("primary", 3)).toBe("var(--chart-1)");
    expect(chartColor("negative", 0)).toBe("var(--destructive)");
    // --success is not defined on the website.
    expect(chartColor("positive", 1)).toBe("var(--chart-2)");
    expect(chartColor("series", 0)).toBe("var(--chart-1)");
    expect(chartColor("constructor", 0)).toBe("var(--chart-1)");
    expect(chartColor(undefined, 6)).toBe("var(--chart-2)");
  });
});

describe("formatChartValue", () => {
  test("clamps decimals to what toFixed accepts", () => {
    expect(formatChartValue(1.5, { decimals: 500 })).toBe(
      "1.50000000000000000000",
    );
    expect(formatChartValue(1.5, { decimals: -3 })).toBe("2");
  });
});

describe("BlogChart", () => {
  test("renders the title and source caption", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    expect(screen.getByText(SPEC.title)).toBeInTheDocument();
    expect(screen.getByText(SPEC.source)).toBeInTheDocument();
  });

  test("draws the bars with signed labels on either side of zero, ticks and a legend", () => {
    const { container } = render(<BlogChart data={JSON.stringify(SPEC)} />);
    const texts = [...container.querySelectorAll("svg text")];
    const label = (t: string) => texts.find((el) => el.textContent === t);
    for (const t of ["+0.07", "+0.22", "−0.06", "+0.86"]) {
      expect(label(t)).toBeDefined();
    }
    // Ticks carry the unit; value labels do not.
    for (const t of ["−0.25 pp", "0.00 pp", "+1.00 pp"]) {
      expect(label(t)).toBeDefined();
    }
    const zero = container.querySelector(
      'line[stroke="var(--border-dark)"]',
    ) as SVGLineElement;
    const zeroY = Number(zero.getAttribute("y1"));
    expect(Number(label("−0.06")?.getAttribute("y"))).toBeGreaterThan(zeroY);
    expect(Number(label("+0.07")?.getAttribute("y"))).toBeLessThan(zeroY);
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      4,
    );
    const legend = [
      ...container.querySelectorAll(".recharts-legend-item-text"),
    ].map((el) => el.textContent);
    expect(legend).toEqual(["Census", "PolicyEngine prediction"]);
  });

  test("names the figure by its title", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    expect(
      screen.getByRole("figure", { name: SPEC.title }),
    ).toBeInTheDocument();
  });

  test("renders nothing for an invalid spec", () => {
    const { container } = render(<BlogChart data="{}" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MarkdownFormatter chart blocks", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the formatter's display-category hook reads it.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  test("renders a chart fence as a chart, without the code-block frame", async () => {
    const markdown = "Intro.\n\n```chart\n" + JSON.stringify(SPEC) + "\n```\n";
    const { container } = render(<MarkdownFormatter markdown={markdown} />);
    // The chart module loads lazily.
    expect(await screen.findByText(SPEC.title)).toBeInTheDocument();
    expect(container.querySelector("figure")).not.toBeNull();
    expect(screen.queryByText("chart")).toBeNull();
    expect(container.textContent).not.toContain('"xKey"');
  });
});
