import { cloneElement, type ReactElement, useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import {
  BlogChart,
  formatChartValue,
  parseBlogChartSpec,
} from "@/components/blog/BlogChart";
import {
  BlogOptionControl,
  optionControlForm,
} from "@/components/blog/BlogOptionControl";
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

  test("valueLabels false draws the bars without value labels", () => {
    const { container } = render(
      <BlogChart data={JSON.stringify({ ...SPEC, valueLabels: false })} />,
    );
    const texts = [...container.querySelectorAll("svg text")].map(
      (el) => el.textContent,
    );
    for (const t of ["+0.07", "+0.22", "−0.06", "+0.86"]) {
      expect(texts).not.toContain(t);
    }
    expect(texts).toContain("+1.00 pp");
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      4,
    );
  });

  test("rejects a non-boolean valueLabels", () => {
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, valueLabels: "no" })),
    ).toBeNull();
  });

  test("rejects an unknown orientation or a non-boolean legend", () => {
    for (const orientation of ["sideways", 3, true]) {
      expect(
        parseBlogChartSpec(JSON.stringify({ ...SPEC, orientation })),
      ).toBeNull();
    }
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, legend: "no" })),
    ).toBeNull();
    const spec = parseBlogChartSpec(
      JSON.stringify({ ...SPEC, orientation: "horizontal", legend: false }),
    );
    expect(spec?.type === "bar" && spec.orientation).toBe("horizontal");
    expect(spec?.type === "bar" && spec.legend).toBe(false);
  });

  test("horizontal bars put the categories down the left and the values on the x-axis", () => {
    const { container } = render(
      <BlogChart
        data={JSON.stringify({ ...SPEC, orientation: "horizontal" })}
      />,
    );
    const texts = [...container.querySelectorAll("svg text")];
    const label = (t: string) => texts.find((el) => el.textContent === t);
    const xTicks = [
      ...container.querySelectorAll(".recharts-xAxis-tick-labels text"),
    ].map((el) => el.textContent);
    const yTicks = [
      ...container.querySelectorAll(".recharts-yAxis-tick-labels text"),
    ].map((el) => el.textContent);
    expect(xTicks).toEqual(
      expect.arrayContaining(["−0.25 pp", "0.00 pp", "+1.00 pp"]),
    );
    expect(yTicks).toEqual(["All people", "Under 18"]);
    // The zero line runs vertically, and each value label sits past its bar's end.
    const zero = container.querySelector(
      'line[stroke="var(--border-dark)"]',
    ) as SVGLineElement;
    const zeroX = Number(zero.getAttribute("x1"));
    expect(Number(zero.getAttribute("x2"))).toBe(zeroX);
    for (const t of ["+0.07", "+0.22", "+0.86"]) {
      expect(Number(label(t)?.getAttribute("x"))).toBeGreaterThan(zeroX);
      expect(label(t)?.getAttribute("text-anchor")).toBe("start");
    }
    expect(Number(label("−0.06")?.getAttribute("x"))).toBeLessThan(zeroX);
    expect(label("−0.06")?.getAttribute("text-anchor")).toBe("end");
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      4,
    );
  });

  test("stacked bars label each row's total once and rescale the axis to the totals", () => {
    expect(
      parseBlogChartSpec(JSON.stringify({ ...SPEC, stacked: "yes" })),
    ).toBeNull();
    const { container } = render(
      <BlogChart
        data={JSON.stringify({
          ...SPEC,
          orientation: "horizontal",
          stacked: true,
          data: [
            { group: "All people", census: 0.3, registered: 0.5 },
            { group: "Under 18", census: 0.1, registered: 0.2 },
          ],
        })}
      />,
    );
    const texts = [...container.querySelectorAll("svg text")].map(
      (el) => el.textContent,
    );
    // Totals 0.80 and 0.30 label the stacks; the segments carry no labels.
    expect(texts).toContain("+0.80");
    expect(texts).toContain("+0.30");
    for (const t of ["+0.50", "+0.20", "+0.10"]) {
      expect(texts).not.toContain(t);
    }
    const ticks = [
      ...container.querySelectorAll(".recharts-xAxis-tick-labels text"),
    ].map((el) => Number((el.textContent ?? "").replace(/[^0-9.]/g, "")));
    expect(Math.max(...ticks)).toBeGreaterThanOrEqual(0.8);
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      4,
    );
  });

  test("legend false leaves the legend out and keeps the bars", () => {
    const { container } = render(
      <BlogChart data={JSON.stringify({ ...SPEC, legend: false })} />,
    );
    expect(container.querySelector(".recharts-legend-wrapper")).toBeNull();
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      4,
    );
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

describe("BlogChart select", () => {
  const SELECT_SPEC = {
    type: "bar",
    title: "Change by decile",
    xKey: "decile",
    series: [
      { key: "y2029", name: "2029-30", color: "primary" },
      {
        key: "cash",
        name: "£ a year",
        color: "tertiary",
        format: { decimals: 0, prefix: "£" },
        yLabel: "Change (£ a year)",
      },
    ],
    data: [
      { decile: "1", y2029: -0.34, cash: -85 },
      { decile: "2", y2029: -0.17, cash: -72 },
    ],
    yLabel: "Change (%)",
    format: { decimals: 1, suffix: "%" },
    select: { label: "Year", default: "y2029" },
  };
  const labels = (container: HTMLElement) =>
    [...container.querySelectorAll("svg text")].map((t) => t.textContent);

  test("draws only the default series, with a labelled segmented group", () => {
    const { container } = render(
      <BlogChart data={JSON.stringify(SELECT_SPEC)} />,
    );
    const group = screen.getByRole("radiogroup", { name: "Year" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual(["2029-30", "£ a year"]);
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
    ]);
    expect(container.querySelector("select")).toBeNull();
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      2,
    );
    expect(labels(container)).toContain("−0.3");
    expect(labels(container)).toContain("Change (%)");
    expect(container.querySelector(".recharts-legend-item-text")).toBeNull();
  });

  test("switching shows the chosen series in its own format and axis label", () => {
    const { container } = render(
      <BlogChart data={JSON.stringify(SELECT_SPEC)} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "£ a year" }));
    expect(screen.getByRole("radio", { name: "£ a year" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(labels(container)).toContain("−£85");
    expect(labels(container)).toContain("Change (£ a year)");
    expect(labels(container)).not.toContain("Change (%)");
    expect(labels(container)).not.toContain("−0.3");
  });

  test("defaults to the first series without a default", () => {
    render(
      <BlogChart
        data={JSON.stringify({ ...SELECT_SPEC, select: { label: "Year" } })}
      />,
    );
    expect(screen.getByRole("radio", { name: "2029-30" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("long series names get a labelled drop-down", () => {
    const long = {
      ...SELECT_SPEC,
      select: { label: "Measure" },
      series: [
        {
          key: "y2029",
          name: "Share in households whose net income falls (%)",
        },
        {
          key: "cash",
          name: "Average change in household net income (£ a year)",
          format: { decimals: 0, prefix: "£" },
          yLabel: "Change (£ a year)",
        },
      ],
    };
    const { container } = render(<BlogChart data={JSON.stringify(long)} />);
    const control = screen.getByLabelText("Measure") as HTMLSelectElement;
    expect(control.tagName).toBe("SELECT");
    expect(control.value).toBe("y2029");
    expect(screen.queryByRole("radiogroup")).toBeNull();
    fireEvent.change(control, { target: { value: "cash" } });
    expect(labels(container)).toContain("Change (£ a year)");
  });

  test("rejects a select without a label or with an unknown default", () => {
    for (const select of [
      { default: "y2029" },
      { label: "", default: "y2029" },
      { label: "Year", default: "y2040" },
      "Year",
    ]) {
      expect(
        parseBlogChartSpec(JSON.stringify({ ...SELECT_SPEC, select })),
      ).toBeNull();
    }
    expect(
      parseBlogChartSpec(
        JSON.stringify({
          ...SELECT_SPEC,
          series: [{ key: "y2029", name: "2029-30", format: { decimals: -1 } }],
        }),
      ),
    ).toBeNull();
  });

  test("a spec without select draws every series, with no control", () => {
    const { container } = render(<BlogChart data={JSON.stringify(SPEC)} />);
    expect(container.querySelector("select")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(container.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(
      4,
    );
  });
});

describe("BlogOptionControl", () => {
  test("a few short options are a segmented group, longer lists a drop-down", () => {
    // The labels of the Milburn briefing's controls.
    expect(optionControlForm(["2029-30", "2030-31", "2031-32"])).toBe(
      "segmented",
    );
    expect(
      optionControlForm([
        "Share in households whose net income falls (%)",
        "Average change in household net income (£ a year)",
      ]),
    ).toBe("select");
    expect(
      optionControlForm([
        "All people (percentage points)",
        "All people (number)",
        "Children (percentage points)",
      ]),
    ).toBe("select");
    expect(
      optionControlForm([
        "Two removals",
        "Higher rate",
        "Work allowance",
        "Employer National Insurance",
      ]),
    ).toBe("select");
    expect(optionControlForm(["A"])).toBe("select");
    expect(optionControlForm(["A", "B", "C", "D", "E"])).toBe("select");
  });

  function Harness() {
    const [value, setValue] = useState("b");
    return (
      <BlogOptionControl
        label="Year"
        options={[
          { value: "a", label: "2029-30" },
          { value: "b", label: "2030-31" },
          { value: "c", label: "2031-32" },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  }

  test("arrow keys, Home and End move the choice and the focus, wrapping", () => {
    render(<Harness />);
    const [a, b, c] = screen.getAllByRole("radio");
    const checked = () =>
      [a, b, c].map((r) => r.getAttribute("aria-checked") === "true");
    // One tab stop: the chosen button.
    expect([a, b, c].map((r) => r.tabIndex)).toEqual([-1, 0, -1]);

    b.focus();
    fireEvent.keyDown(b, { key: "ArrowRight" });
    expect(checked()).toEqual([false, false, true]);
    expect(document.activeElement).toBe(c);
    expect([a, b, c].map((r) => r.tabIndex)).toEqual([-1, -1, 0]);

    fireEvent.keyDown(c, { key: "ArrowDown" });
    expect(checked()).toEqual([true, false, false]);
    expect(document.activeElement).toBe(a);

    fireEvent.keyDown(a, { key: "ArrowLeft" });
    expect(checked()).toEqual([false, false, true]);
    expect(document.activeElement).toBe(c);

    fireEvent.keyDown(c, { key: "Home" });
    expect(checked()).toEqual([true, false, false]);
    expect(document.activeElement).toBe(a);

    fireEvent.keyDown(a, { key: "End" });
    expect(checked()).toEqual([false, false, true]);
    expect(document.activeElement).toBe(c);

    fireEvent.keyDown(c, { key: "ArrowUp" });
    expect(checked()).toEqual([false, true, false]);
    expect(document.activeElement).toBe(b);

    // Other keys leave the choice alone.
    fireEvent.keyDown(b, { key: "a" });
    expect(checked()).toEqual([false, true, false]);
  });
});
