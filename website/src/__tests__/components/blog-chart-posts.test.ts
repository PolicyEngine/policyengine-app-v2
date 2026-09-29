import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  formatChartValue,
  niceTicks,
  parseBlogChartSpec,
} from "@/components/blog/BlogChart";

const ARTICLES = join(__dirname, "../../../../app/src/data/posts/articles");

function chartFences(markdown: string): string[] {
  return [...markdown.matchAll(/^```chart\n([\s\S]*?)^```$/gm)].map(
    (m) => m[1],
  );
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

describe("niceTicks", () => {
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
