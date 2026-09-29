import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  formatChartValue,
  niceTicks,
  parseBlogChartSpec,
} from "@/components/blog/BlogChart";
import {
  CHART_FENCE,
  chartBlocksAsProse,
  readingTimeLabel,
} from "@/components/blog/chartReadingText";

const ARTICLES = join(__dirname, "../../../../app/src/data/posts/articles");

function chartFences(markdown: string): string[] {
  return [...markdown.matchAll(CHART_FENCE)].map((m) => m[1]);
}

const posts = readdirSync(ARTICLES)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ file: f, markdown: readFileSync(join(ARTICLES, f), "utf8") }));

describe("chart blocks in posts", () => {
  // An invalid spec renders nothing, so a broken block would vanish silently.
  test("every chart block in every post parses", () => {
    const blocks = posts.flatMap(({ file, markdown }) =>
      chartFences(markdown).map((raw) => ({ file, raw })),
    );
    expect(blocks.length).toBeGreaterThan(0);
    for (const { file, raw } of blocks) {
      expect(parseBlogChartSpec(raw), file).not.toBeNull();
    }
  });

  test("the 2025 SPM post draws its three figures as charts", () => {
    const post = posts.find(
      (p) => p.file === "2025-supplemental-poverty-measure.md",
    );
    const specs = chartFences(post?.markdown ?? "").map(parseBlogChartSpec);
    expect(specs.map((s) => s?.type)).toEqual([
      "stateMap",
      "waterfall",
      "stateMap",
    ]);
    for (const spec of specs) {
      if (spec?.type === "stateMap") expect(spec.data).toHaveLength(51);
      if (spec?.type === "waterfall") expect(spec.data).toHaveLength(4);
    }
    expect(post?.markdown).not.toMatch(
      /2025-supplemental-poverty-measure\/.*\.png/,
    );
  });
});

describe("SPM post figures", () => {
  const post = posts.find(
    (p) => p.file === "2025-supplemental-poverty-measure.md",
  );
  const [statesAvg, waterfall, effect] = chartFences(post?.markdown ?? "").map(
    parseBlogChartSpec,
  );
  const rows = (spec: typeof statesAvg) =>
    spec?.type === "stateMap"
      ? Object.fromEntries(
          spec.data.map((r) => [r[spec.stateKey], r[spec.valueKey]]),
        )
      : {};

  // Spot checks against spm-threshold-paper's result files, so an edit to a
  // published figure fails here as well as in review.
  test("keeps the published values", () => {
    expect(rows(statesAvg)).toMatchObject({ LA: 19.0, ME: 6.4, CA: 17.8 });
    expect(rows(effect)).toMatchObject({ AL: 1.71, NE: 0.0, NY: 1.5 });
    expect(waterfall?.type === "waterfall" && waterfall.data[0]).toEqual({
      group: "All people",
      y2024_census: 13.0,
      resources_step: -0.6911,
      threshold_step: 0.8028,
      published_2025: 13.1117,
    });
  });
});

describe("reading time", () => {
  test("counts a chart block as its title, subtitle, note and source", () => {
    const block =
      '```chart\n{"type": "bar", "title": "One two", "subtitle": "three", "note": "four", "source": "five six", "data": [{"a": 1}]}\n```';
    const words = (md: string) => chartBlocksAsProse(md).trim().split(/\s+/);
    expect(words(`Intro.\n\n${block}\n`)).toEqual([
      "Intro.",
      "One",
      "two",
      "three",
      "four",
      "five",
      "six",
    ]);
    expect(chartBlocksAsProse("```chart\n{broken\n```").trim()).toBe("");
    // A closing fence with trailing spaces or a CR still ends the block, so
    // the prose after it counts.
    const loose = block.replace(/```$/, "```  ").replace(/\n/g, "\r\n");
    expect(
      words(`${loose}\r\nAfter the chart.\r\n\n\`\`\`js\nx\n\`\`\``),
    ).toEqual(expect.arrayContaining(["After", "the", "chart.", "six"]));
  });

  // Replacing the PNGs with charts leaves each post's reading time as it was.
  test("keeps the SPM posts' reading times", () => {
    const text = (file: string) =>
      posts.find((p) => p.file === file)?.markdown ?? "";
    expect(readingTimeLabel(text("2025-supplemental-poverty-measure.md"))).toBe(
      "10 min read",
    );
    expect(readingTimeLabel(text("2025-spm-poverty-prediction.md"))).toBe(
      "13 min read",
    );
  });
});

describe("niceTicks", () => {
  test("gives a finite axis for values near the largest double", () => {
    for (const values of [
      [1.6e308],
      [-1.6e308],
      [Number.MAX_VALUE],
      [-1.29e308, 1],
      [-8e307, 9e307],
    ]) {
      const { domain, ticks, decimals } = niceTicks(values);
      expect(domain.every(Number.isFinite)).toBe(true);
      expect(domain[0]).toBeLessThanOrEqual(Math.min(0, ...values));
      expect(domain[1]).toBeGreaterThanOrEqual(Math.max(0, ...values));
      expect(() =>
        ticks.map((t) => formatChartValue(t, { decimals })),
      ).not.toThrow();
    }
  });

  test("gives a usable axis for spans too small to step through", () => {
    for (const v of [5e-324, 1e-300, 1e-12]) {
      const { domain, ticks, decimals } = niceTicks([v]);
      expect(domain).toEqual([0, 0.25]);
      expect(ticks).toEqual([0, 0.25]);
      expect(() =>
        ticks.map((t) => formatChartValue(t, { decimals })),
      ).not.toThrow();
    }
  });

  // Invariants: the domain holds zero and every value, the ticks start and
  // end on the domain, and they are evenly spaced.
  test("covers the values with evenly spaced ticks", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -1e6, max: 1e6, noNaN: true }), {
          minLength: 1,
          maxLength: 20,
        }),
        (values) => {
          const { domain, ticks } = niceTicks(values);
          const tol =
            1e-9 * Math.max(1, Math.abs(domain[0]), Math.abs(domain[1]));
          expect(domain[0]).toBeLessThanOrEqual(Math.min(0, ...values) + tol);
          expect(domain[1]).toBeGreaterThanOrEqual(
            Math.max(0, ...values) - tol,
          );
          expect(ticks[0]).toBeCloseTo(domain[0], 6);
          expect(ticks[ticks.length - 1]).toBeCloseTo(domain[1], 6);
          const step = ticks[1] - ticks[0];
          for (let i = 1; i < ticks.length; i++) {
            expect(
              Math.abs(ticks[i] - ticks[i - 1] - step),
            ).toBeLessThanOrEqual(1e-6 * Math.max(1, Math.abs(step)));
          }
        },
      ),
    );
  });
});
