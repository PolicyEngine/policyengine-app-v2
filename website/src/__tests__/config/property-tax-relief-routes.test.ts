// @vitest-environment node
import fc from "fast-check";
import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";
import { resolveRoute } from "../helpers/resolveRoute";

const BASE = "/us/rent-and-property-taxes";
const CHILD = "https://property-tax-relief.vercel.app";
const ASSETS = "/_zones/property-tax-relief/_next/static";
const PAGES = [BASE, `${BASE}/report`, `${BASE}/methods`];
const label = fc.stringMatching(/^[a-z][a-z0-9_-]{0,11}$/);

// This tests the actual host config with the existing Next-based resolver.
// It does not model the child response or certify deployed redirect behavior.
// Invariants: only these pages gain an upstream slash; file/asset paths and
// query values survive unchanged; incoming slash normalization stays on host.
describe("rent and property tax report routes", () => {
  test.each(PAGES.flatMap((page) => [page, `${page}/`]))(
    "given page %s then reach its slash-terminated child destination",
    async (path) => {
      const page = path.replace(/\/$/, "");
      const resolved = await resolveRoute(path);
      expect(resolved.upstream?.toString()).toBe(`${CHILD}${page}/`);
      expect(resolved.pathname).toBe(page);
      expect(resolved.hops).toEqual(path.endsWith("/") ? [page] : []);
      expect(nextConfig.trailingSlash).not.toBe(true);
    },
  );

  test("given report and methods pages then exact rules precede the broad file route", async () => {
    const rewrites = await nextConfig.rewrites!();
    if (Array.isArray(rewrites)) throw new Error("Expected phased rewrites");
    const beforeFiles = rewrites.beforeFiles ?? [];
    const broadIndex = beforeFiles.findIndex(
      (route) => route.source === `${BASE}/:path*`,
    );
    expect(broadIndex).toBeGreaterThan(-1);
    for (const page of PAGES.slice(1)) {
      const pageIndex = beforeFiles.findIndex((route) => route.source === page);
      expect(pageIndex).toBeGreaterThan(-1);
      expect(pageIndex).toBeLessThan(broadIndex);
    }
    expect(beforeFiles[broadIndex].destination).toBe(`${CHILD}${BASE}/:path*`);
  });

  test.each([
    `${BASE}/data/inventory.json`,
    `${BASE}/data/inventory.csv`,
    `${BASE}/__next._full.txt`,
    `${BASE}/report/__next.report.__PAGE__.txt`,
    `${BASE}/methods/__next._tree.txt`,
    `${BASE}/report.txt`,
    `${ASSETS}/chunks/turbopack-2ldtdtmjp3oyl.js`,
    `${ASSETS}/chunks/1-332mdft_t7o.css`,
    `${ASSETS}/media/font.woff2`,
  ])(
    "given file %s then preserve its path and query without adding a slash",
    async (path) => {
      const resolved = await resolveRoute(`${path}?download=1`);
      expect(resolved.upstream?.pathname).toBe(path);
      expect(resolved.upstream?.origin).toBe(CHILD);
      expect(resolved.upstream?.searchParams.get("download")).toBe("1");
      expect(resolved.hops).toEqual([]);
    },
  );

  test.each<[string, string | null]>([
    [
      "/us/tanf-calculator",
      "https://tanf-calculator.vercel.app/us/tanf-calculator",
    ],
    [
      "/uk/energy-autumn-budget",
      "https://uk-energy-autumn-budget.vercel.app/uk/energy-autumn-budget",
    ],
    [
      "/us/2025-year-in-review",
      "https://policyengine-2025-year-in-review.vercel.app/2025-year-in-review/us",
    ],
    ["/us/research/example-post", null],
    [
      `${BASE}/favicon.ico`,
      "https://www.policyengine.org/assets/logos/policyengine/teal-square.png?countryId=us&appSlug=rent-and-property-taxes",
    ],
  ])(
    "given unrelated or shared route %s then preserve its destination",
    async (path, expected) => {
      const resolved = await resolveRoute(path);
      expect(resolved.upstream?.toString() ?? null).toBe(expected);
    },
  );

  test("given any generated page/query then preserve the query and canonical child slash", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PAGES),
        fc.boolean(),
        fc.constantFrom("q", "_rsc", "state"),
        label,
        async (page, slash, key, value) => {
          const resolved = await resolveRoute(
            `${page}${slash ? "/" : ""}?${key}=${value}`,
          );
          expect(resolved.upstream?.origin).toBe(CHILD);
          expect(resolved.upstream?.pathname).toBe(`${page}/`);
          expect(resolved.upstream?.searchParams.get(key)).toBe(value);
          expect(resolved.hops).toHaveLength(slash ? 1 : 0);
        },
      ),
      { numRuns: 100, seed: 20261121 },
    );
  });

  test("given any generated deep file then preserve its path without a page slash", async () => {
    await fc.assert(
      fc.asyncProperty(
        label,
        fc.constantFrom("json", "csv", "txt"),
        label,
        async (name, extension, value) => {
          const path = `${BASE}/report/data/${name}.${extension}`;
          const resolved = await resolveRoute(`${path}?q=${value}`);
          expect(resolved.upstream?.origin).toBe(CHILD);
          expect(resolved.upstream?.pathname).toBe(path);
          expect(resolved.upstream?.searchParams.get("q")).toBe(value);
          expect(resolved.hops).toEqual([]);
        },
      ),
      { numRuns: 100, seed: 20261122 },
    );
  });

  test("given any generated zone asset then preserve its path without a page slash", async () => {
    await fc.assert(
      fc.asyncProperty(
        label,
        fc.constantFrom("js", "css", "woff2"),
        async (name, extension) => {
          const path = `${ASSETS}/chunks/${name}.${extension}`;
          const resolved = await resolveRoute(path);
          expect(resolved.upstream?.toString()).toBe(`${CHILD}${path}`);
          expect(resolved.hops).toEqual([]);
        },
      ),
      { numRuns: 100, seed: 20261123 },
    );
  });
});
