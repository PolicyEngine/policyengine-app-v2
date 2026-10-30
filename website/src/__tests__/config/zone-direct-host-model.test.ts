// @vitest-environment node
import {
  getRedirectUrl,
  getRewrittenUrl,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { describe, expect, test } from "vitest";

// The direct-host audit models the zone rewrites itself, since it runs in CI
// without installing Next. This checks its model against Next's own routing.
import {
  proxiedUrl,
  zoneRoutes,
} from "../../../../.github/scripts/audit-zone-direct-hosts.mjs";
import nextConfig from "../../../next.config";
import { type AppZoneRoute, appZoneRewrites } from "../../data/appZoneRoutes";

const ORIGIN = "https://www.policyengine.org";
const SEED = 20261029;
const CASES_PER_ZONE = 25;

// Seeded so a failure reproduces; the message names the URL.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalized(url: string | null) {
  if (!url) return null;
  const parsed = new URL(url);
  parsed.searchParams.sort();
  return parsed.toString();
}

/**
 * Paths under a zone's source, in the shapes a reader's link takes: a
 * suffix, a trailing slash, other letter case, and a query that can set the
 * key a shared host's rewrite sets (country). Each key appears once: Next's
 * testing helper joins a repeated key's values with commas, which its server
 * doesn't.
 */
function publicUrls(source: string, random: () => number) {
  const pick = (chars: string, length: number) =>
    Array.from(
      { length },
      () => chars[Math.floor(random() * chars.length)],
    ).join("");
  const urls: string[] = [];
  for (let i = 0; i < CASES_PER_ZONE; i += 1) {
    const segments = Array.from({ length: Math.floor(random() * 4) }, () =>
      pick(
        "abcdefghijklmnopqrstuvwxyz0123456789-_",
        1 + Math.floor(random() * 8),
      ),
    );
    let path = `${source}${segments.map((segment) => `/${segment}`).join("")}`;
    if (random() < 0.2) path = path.toUpperCase();
    if (random() < 0.2) path = `${path}/`;
    const keys = new Set(
      Array.from({ length: Math.floor(random() * 4) }, () =>
        random() < 0.3 ? "country" : `q${pick("abcdef", 2)}`,
      ),
    );
    const query = [...keys]
      .map((key) => `${key}=${pick("abcuk123", Math.floor(random() * 4))}`)
      .join("&");
    urls.push(`${ORIGIN}${path}${query ? `?${query}` : ""}`);
  }
  return urls;
}

describe("the direct-host audit's model of the zone rewrites", () => {
  const zones: AppZoneRoute[] = zoneRoutes(appZoneRewrites);

  test("covers every zone on a Vercel host", () => {
    expect(zones.length).toBeGreaterThan(40);
  });

  test("proxies each URL where Next does, to the same zone URL", async () => {
    const random = mulberry32(SEED);
    const sources = [
      ...zones.map((zone) => zone.source),
      // The year in review's asset route, and paths no zone rewrite serves.
      "/us/2025-year-in-review/x",
      "/2025-year-in-review",
      "/2025-year-in-review/us",
      "/us/research/some-post",
    ];
    let compared = 0;
    for (const source of sources) {
      for (const url of publicUrls(source, random)) {
        const response = await unstable_getResponseFromNextConfig({
          url,
          nextConfig,
        });
        // The website's redirects run first; the audit follows those live.
        if (getRedirectUrl(response)) continue;
        compared += 1;
        expect(
          normalized(proxiedUrl(appZoneRewrites, url)?.url ?? null),
          url,
        ).toBe(normalized(getRewrittenUrl(response)));
      }
    }
    expect(compared).toBeGreaterThan(zones.length * 10);
  });
});
