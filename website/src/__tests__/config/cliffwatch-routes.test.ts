import { existsSync } from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";
import appsData from "@/data/apps.json";
import { appZoneRoutes } from "@/data/appZoneRoutes";
import { resolveRoute } from "../helpers/resolveRoute";

// CliffWatch (cliff-watch.vercel.app) is US-only: its static client renders
// the US tool whatever query the website sends upstream. UK CliffWatch is a
// separate zone. Invariants, for every path and query:
//   1. no /uk/... path is proxied to the US zone;
//   2. /uk/cliffwatch and /uk/cliff-watch, with any suffix, reach UK
//      CliffWatch in exactly one permanent redirect, suffix kept;
//   3. /us/cliffwatch and /us/cliff-watch, with any suffix, still reach the
//      US zone (its basePath assets arrive via /us/cliff-watch).

const US_ZONE = "cliff-watch.vercel.app";
const UK_ZONE = "uk-cliff-watch.vercel.app";

// No leading dot: URLs collapse "." and ".." segments before routing.
const segment = fc.stringMatching(/^[A-Za-z0-9_~-][A-Za-z0-9._~-]{0,11}$/);
const suffix = fc
  .array(segment, { maxLength: 4 })
  .map((parts) => parts.map((part) => `/${part}`).join(""));
const query = fc
  .array(
    fc.tuple(fc.constantFrom("s", "zip", "p", "max", "country"), segment),
    {
      maxLength: 3,
    },
  )
  .map((pairs) =>
    pairs.length ? `?${new URLSearchParams(pairs).toString()}` : "",
  );

// Next regroups repeated query keys, so compare params, not their order.
function sortedQuery(search: string) {
  return [...new URLSearchParams(search)].sort(([a, x], [b, y]) =>
    a === b ? x.localeCompare(y) : a.localeCompare(b),
  );
}

async function getAllRewrites() {
  const rewrites = await nextConfig.rewrites!();
  if (Array.isArray(rewrites)) {
    throw new Error("Expected rewrites to be grouped by phase.");
  }
  return [
    ...(rewrites.beforeFiles ?? []),
    ...(rewrites.afterFiles ?? []),
    ...(rewrites.fallback ?? []),
  ];
}

describe("UK CliffWatch routes", () => {
  test.each(["/uk/cliffwatch", "/uk/cliff-watch"])(
    "308s %s straight to UK CliffWatch",
    async (source) => {
      const redirects = await nextConfig.redirects!();
      expect(redirects).toContainEqual({
        source,
        destination: "/uk/uk-cliff-watch",
        permanent: true,
      });
      expect(redirects).toContainEqual({
        source: `${source}/:path*`,
        destination: "/uk/uk-cliff-watch/:path*",
        permanent: true,
      });

      const resolved = await resolveRoute(source);
      expect(resolved.hops).toEqual(["/uk/uk-cliff-watch"]);
      expect(resolved.upstream?.href).toBe(
        `https://${UK_ZONE}/uk/uk-cliff-watch`,
      );
    },
  );

  test("matches the UK slugs before the generic cliff-watch rename", async () => {
    // Otherwise /uk/cliff-watch would hop through /uk/cliffwatch first.
    const sources = (await nextConfig.redirects!()).map((r) => r.source);
    const rename = sources.indexOf("/:countryId/cliff-watch");

    expect(rename).toBeGreaterThan(-1);
    for (const source of ["/uk/cliffwatch", "/uk/cliff-watch"]) {
      expect(sources.indexOf(source)).toBeGreaterThan(-1);
      expect(sources.indexOf(source)).toBeLessThan(rename);
    }
  });

  test("keeps the suffix, so UK CliffWatch's own og:image still resolves", async () => {
    // uk-cliff-watch's layout still points og:image at this path.
    const resolved = await resolveRoute("/uk/cliffwatch/cliffwatch-og.png");

    expect(resolved.hops).toEqual(["/uk/uk-cliff-watch/cliffwatch-og.png"]);
    expect(resolved.upstream?.href).toBe(
      `https://${UK_ZONE}/uk/uk-cliff-watch/cliffwatch-og.png`,
    );
  });

  test("no longer proxies /uk/cliffwatch to any zone", async () => {
    expect(
      appZoneRoutes.filter((route) => route.source.startsWith("/uk/cliff")),
    ).toEqual([]);

    const ukCliffRewrites = (await getAllRewrites()).filter((rewrite) =>
      /^\/uk\/cliff-?watch(\/|$)/i.test(rewrite.source),
    );
    expect(ukCliffRewrites).toEqual([]);
  });

  test("proxies the US CliffWatch zone only under /us/", async () => {
    const usZoneRewrites = (await getAllRewrites()).filter(
      (rewrite) => new URL(rewrite.destination, "https://x").host === US_ZONE,
    );

    expect(usZoneRewrites.length).toBeGreaterThan(0);
    for (const rewrite of usZoneRewrites) {
      expect(rewrite.source).toMatch(/^\/us\//);
    }
  });

  test("every UK CliffWatch slug, suffix and query reaches the UK zone in one hop", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          "/uk/cliffwatch",
          "/uk/cliff-watch",
          "/UK/CliffWatch",
          "/uk/Cliff-Watch",
        ),
        suffix,
        query,
        async (slug, rest, search) => {
          const resolved = await resolveRoute(`${slug}${rest}${search}`);

          expect(resolved.hops).toHaveLength(1);
          expect(resolved.pathname).toBe(`/uk/uk-cliff-watch${rest}`);
          expect(
            sortedQuery(new URL(resolved.hops[0], "https://x").search),
          ).toEqual(sortedQuery(search));
          expect(resolved.upstream?.host).toBe(UK_ZONE);
          expect(resolved.upstream?.pathname).toBe(`/uk/uk-cliff-watch${rest}`);
        },
      ),
      { numRuns: 200 },
    );
  });

  test("no /uk/ path reaches the US CliffWatch zone", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constantFrom(
            "cliffwatch",
            "cliff-watch",
            "uk-cliff-watch",
            "CliffWatch",
          ),
          segment,
        ),
        suffix,
        query,
        async (slug, rest, search) => {
          const resolved = await resolveRoute(`/uk/${slug}${rest}${search}`);

          expect(resolved.upstream?.host).not.toBe(US_ZONE);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe("US CliffWatch routes", () => {
  test("proxies /us/cliffwatch with no redirect", async () => {
    await fc.assert(
      fc.asyncProperty(suffix, query, async (rest, search) => {
        const resolved = await resolveRoute(`/us/cliffwatch${rest}${search}`);

        expect(resolved.hops).toEqual([]);
        expect(resolved.upstream?.host).toBe(US_ZONE);
        expect(resolved.upstream?.pathname).toBe(rest || "/");
      }),
      { numRuns: 100 },
    );
  });

  test("still 308s /us/cliff-watch to /us/cliffwatch, suffix kept", async () => {
    await fc.assert(
      fc.asyncProperty(suffix, query, async (rest, search) => {
        const resolved = await resolveRoute(`/us/cliff-watch${rest}${search}`);

        expect(resolved.hops).toHaveLength(1);
        const hop = new URL(resolved.hops[0], "https://x");
        expect(hop.pathname).toBe(`/us/cliffwatch${rest}`);
        expect(sortedQuery(hop.search)).toEqual(sortedQuery(search));
        expect(resolved.upstream?.host).toBe(US_ZONE);
      }),
      { numRuns: 100 },
    );
  });

  test.each([
    "/us/cliff-watch/_next/static/chunks/app.js",
    "/us/cliff-watch/api/series",
  ])("still serves the US zone's basePath asset %s", async (asset) => {
    const resolved = await resolveRoute(asset);

    expect(resolved.upstream?.host).toBe(US_ZONE);
    expect(resolved.upstream?.pathname).toBe(
      asset.replace("/us/cliff-watch", ""),
    );
  });
});

describe("CliffWatch research card image", () => {
  test("uses a current CliffWatch screenshot that exists on disk", () => {
    const cliffwatch = (appsData as { slug?: string; image?: string }[]).find(
      (app) => app.slug === "cliffwatch",
    );

    expect(cliffwatch?.image).toBe("cliffwatch.png");
    expect(
      existsSync(
        path.resolve(
          __dirname,
          "../../../public/assets/posts",
          cliffwatch?.image ?? "",
        ),
      ),
    ).toBe(true);
  });
});
