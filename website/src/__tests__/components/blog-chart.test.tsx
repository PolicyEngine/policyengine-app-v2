import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import {
  BlogChart,
  formatChartValue,
  parseBlogChartSpec,
} from "@/components/blog/BlogChart";
import { MarkdownFormatter } from "@/components/blog/MarkdownFormatter";

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
    expect(parseBlogChartSpec(JSON.stringify(SPEC))?.series).toHaveLength(2);
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
});

describe("BlogChart", () => {
  test("renders the title and source caption", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    expect(screen.getByText(SPEC.title)).toBeInTheDocument();
    expect(screen.getByText(SPEC.source)).toBeInTheDocument();
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

  test("renders a chart fence as a chart, without the code-block frame", () => {
    const markdown = "Intro.\n\n```chart\n" + JSON.stringify(SPEC) + "\n```\n";
    const { container } = render(<MarkdownFormatter markdown={markdown} />);
    expect(screen.getByText(SPEC.title)).toBeInTheDocument();
    expect(container.querySelector("figure")).not.toBeNull();
    expect(screen.queryByText("chart")).toBeNull();
    expect(container.textContent).not.toContain('"xKey"');
  });
});
