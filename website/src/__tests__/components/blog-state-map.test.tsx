import { fireEvent, render, screen, within } from "@testing-library/react";
import fc from "fast-check";
import { beforeAll, describe, expect, test } from "vitest";

import { BlogChart, parseBlogChartSpec } from "@/components/blog/BlogChart";
import {
  type BlogStateMapBin,
  US_STATE_TILES,
  binIndex,
  binShade,
  parseStateMapSpec,
} from "@/components/blog/BlogStateMap";

const BINS = [
  { below: 9, label: "under 9%" },
  { below: 12, label: "9 to 12%" },
  { below: 15, label: "12 to 15%" },
  { below: 18, label: "15 to 18%" },
  { label: "18% and up" },
];

const SPEC = {
  type: "stateMap",
  title: "SPM poverty by state, 2023 to 2025 average",
  stateKey: "state",
  valueKey: "spm_pct",
  summary: { label: "United States", value: 13.0 },
  bins: BINS,
  data: [
    { state: "AL", spm_pct: 14.4 },
    { state: "LA", spm_pct: 19.0 },
    { state: "ME", spm_pct: 6.4 },
  ],
  format: { decimals: 1, suffix: "%" },
  note: "Tiles are equal in size.",
  source: "Source: test fixture.",
};

const parse = (spec: unknown) =>
  parseStateMapSpec(JSON.parse(JSON.stringify(spec)));

describe("US_STATE_TILES", () => {
  test("places the 50 states and DC on distinct cells of the 11 by 8 grid", () => {
    const tiles = Object.values(US_STATE_TILES);
    expect(tiles).toHaveLength(51);
    expect(US_STATE_TILES.DC.name).toBe("District of Columbia");
    const cells = new Set(tiles.map((t) => `${t.col},${t.row}`));
    expect(cells.size).toBe(51);
    for (const t of tiles) {
      expect(t.col).toBeGreaterThanOrEqual(0);
      expect(t.col).toBeLessThan(11);
      expect(t.row).toBeGreaterThanOrEqual(0);
      expect(t.row).toBeLessThan(8);
    }
  });
});

describe("binIndex", () => {
  test("puts each boundary value in the bin above it", () => {
    expect(binIndex(8.99, BINS)).toBe(0);
    expect(binIndex(9, BINS)).toBe(1);
    expect(binIndex(17.99, BINS)).toBe(3);
    expect(binIndex(18, BINS)).toBe(4);
    expect(binIndex(-5, BINS)).toBe(0);
    expect(binIndex(1e9, BINS)).toBe(4);
  });

  // Invariants: every value lands in exactly one bin, the value is under that
  // bin's bound and at or above the previous bin's, and the bin never
  // decreases as the value rises.
  test("assigns every value to the one bin whose range holds it", () => {
    const binsArb = fc
      .uniqueArray(fc.double({ min: -1e6, max: 1e6, noNaN: true }), {
        minLength: 1,
        maxLength: 6,
      })
      .map((bounds): BlogStateMapBin[] => [
        ...[...bounds]
          .sort((a, b) => a - b)
          .map((below) => ({ below, label: "" })),
        { label: "" },
      ]);
    const value = fc.double({ min: -2e6, max: 2e6, noNaN: true });
    fc.assert(
      fc.property(binsArb, value, value, (bins, a, b) => {
        const i = binIndex(a, bins);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(bins.length);
        const upper = bins[i].below;
        const lower = i > 0 ? bins[i - 1].below : undefined;
        if (upper !== undefined) expect(a).toBeLessThan(upper);
        if (lower !== undefined) expect(a).toBeGreaterThanOrEqual(lower);
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(binIndex(lo, bins)).toBeLessThanOrEqual(binIndex(hi, bins));
      }),
    );
  });
});

describe("binShade", () => {
  test("mixes more primary into each higher bin and ends on the full primary", () => {
    for (let n = 2; n <= 7; n++) {
      const shades = Array.from({ length: n }, (_, i) => binShade(i, n));
      const pct = shades.map((s) =>
        s.fill === "var(--primary)"
          ? 100
          : Number(/var\(--primary\) (\d+)%/.exec(s.fill)?.[1]),
      );
      expect(pct[0]).toBe(12);
      expect(pct[n - 1]).toBe(100);
      for (let i = 1; i < n; i++) expect(pct[i]).toBeGreaterThan(pct[i - 1]);
      expect(shades[n - 1].text).toBe("var(--text-inverse)");
      for (const s of shades.slice(0, -1)) {
        expect(s.text).toBe("var(--foreground)");
      }
    }
  });
});

describe("parseStateMapSpec", () => {
  test("accepts a valid spec, through the chart dispatcher too", () => {
    expect(parse(SPEC)?.data).toHaveLength(3);
    expect(parseBlogChartSpec(JSON.stringify(SPEC))?.type).toBe("stateMap");
  });

  test("rejects malformed specs", () => {
    const row = SPEC.data[0];
    expect(parse({ ...SPEC, valueKey: 2 })).toBeNull();
    expect(parse({ ...SPEC, data: [] })).toBeNull();
    expect(parse({ ...SPEC, data: [{ ...row, state: "XX" }] })).toBeNull();
    expect(parse({ ...SPEC, data: [{ ...row, state: "al" }] })).toBeNull();
    expect(
      parse({ ...SPEC, data: [{ ...row, state: "constructor" }] }),
    ).toBeNull();
    expect(parse({ ...SPEC, data: [row, row] })).toBeNull();
    expect(parse({ ...SPEC, data: [{ ...row, spm_pct: "14.4" }] })).toBeNull();
    expect(parse({ ...SPEC, bins: BINS.slice(-1) })).toBeNull();
    expect(
      parse({ ...SPEC, bins: [BINS[1], BINS[0], ...BINS.slice(2)] }),
    ).toBeNull();
    expect(
      parse({
        ...SPEC,
        bins: [...BINS.slice(0, -1), { below: 30, label: "" }],
      }),
    ).toBeNull();
    expect(parse({ ...SPEC, summary: { label: "US" } })).toBeNull();
  });
});

describe("BlogChart state map", () => {
  beforeAll(() => {
    // jsdom has no PointerEvent, so fired pointer events lose pointerType.
    if (!("PointerEvent" in window)) {
      class PointerEvent extends MouseEvent {
        pointerType: string;
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerType = init.pointerType ?? "";
        }
      }
      Object.defineProperty(window, "PointerEvent", {
        value: PointerEvent,
        configurable: true,
      });
    }
  });

  test("renders every state tile, the legend, summary and note", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    const map = screen.getByRole("list", { name: SPEC.title });
    expect(within(map).getAllByRole("listitem")).toHaveLength(51);
    const alabama = within(map).getByRole("listitem", {
      name: "Alabama: 14.4%",
    });
    expect(alabama).toHaveTextContent("AL14.4");
    expect(
      within(map).getByRole("listitem", { name: "Texas: no data" }),
    ).toHaveTextContent("TX–");
    expect(screen.getByText("United States: 13.0%")).toBeInTheDocument();
    for (const bin of BINS) {
      expect(screen.getByText(bin.label)).toBeInTheDocument();
    }
    expect(screen.getByText(SPEC.note)).toBeInTheDocument();
    expect(screen.getByText(SPEC.source)).toBeInTheDocument();
  });

  test("shows the state's name and value on hover and on tap", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    const louisiana = screen.getByRole("listitem", {
      name: "Louisiana: 19.0%",
    });
    const mouse = { pointerType: "mouse" };
    fireEvent.pointerEnter(louisiana, mouse);
    const tip = screen.getByRole("tooltip");
    expect(tip).toHaveTextContent("Louisiana");
    expect(tip).toHaveTextContent("19.0%");
    // A mouse click keeps the hover tooltip.
    fireEvent.pointerDown(louisiana, mouse);
    fireEvent.click(louisiana);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Louisiana");
    fireEvent.pointerLeave(louisiana, mouse);
    expect(screen.queryByRole("tooltip")).toBeNull();

    // A tap toggles it, and the touch pointer leaving does not close it.
    const touch = { pointerType: "touch" };
    fireEvent.pointerEnter(louisiana, touch);
    fireEvent.pointerDown(louisiana, touch);
    fireEvent.click(louisiana);
    fireEvent.pointerLeave(louisiana, touch);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Louisiana");
    fireEvent.pointerDown(louisiana, touch);
    fireEvent.click(louisiana);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("closes a tapped tooltip on a tap outside the map", () => {
    render(<BlogChart data={JSON.stringify(SPEC)} />);
    const alabama = screen.getByRole("listitem", { name: "Alabama: 14.4%" });
    fireEvent.pointerDown(alabama, { pointerType: "touch" });
    fireEvent.click(alabama);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Alabama");
    fireEvent.pointerDown(screen.getByText(SPEC.title), {
      pointerType: "touch",
    });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  test("anchors tooltips near either edge to that edge", () => {
    render(
      <BlogChart
        data={JSON.stringify({
          ...SPEC,
          data: [...SPEC.data, { state: "DC", spm_pct: 15.7 }],
        })}
      />,
    );
    const mouse = { pointerType: "mouse" };
    const dc = screen.getByRole("listitem", {
      name: "District of Columbia: 15.7%",
    });
    fireEvent.pointerEnter(dc, mouse);
    const tip = screen.getByRole("tooltip");
    expect(tip.style.right).not.toBe("");
    expect(tip.style.left).toBe("");
    fireEvent.pointerLeave(dc, mouse);
    fireEvent.pointerEnter(
      screen.getByRole("listitem", { name: "Arizona: no data" }),
      mouse,
    );
    expect(screen.getByRole("tooltip").style.left).toBe("9.090909090909092%");
  });
});
