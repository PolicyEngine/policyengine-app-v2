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
import { policyEngineIconRewrites } from "../../data/policyEngineIconRewrites";

const ORIGIN = "https://www.policyengine.org";
const SEED = 20261029;
const CASES_PER_ZONE = 25;
// The website's rewrites in the order next.config.ts applies them: its icons
// first, so a zone's icon paths are served from the website.
const REWRITES = [...policyEngineIconRewrites, ...appZoneRewrites];
// Next's helper rebuilds its route matchers for each of about 2,000 URLs,
// which took 12 seconds in review (2026-10-29), past Vitest's default of 5.
const DIFFERENTIAL_TIMEOUT_MS = 120_000;

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
 * suffix, one of the website's icon paths, a trailing slash, other letter
 * case, and a query that can set the key a shared host's rewrite sets
 * (country). Each key appears once: Next's testing helper joins a repeated
 * key's values with commas, which its server doesn't.
 *
 * On letter case, the model follows the deployed site: www serves /US/GIVECALC
 * its own 404 (2026-10-29), and the helper agrees, since it matches each rule
 * by its regular expression's source without the case-insensitive flag. Next's
 * server matcher has that flag, so the helper, not the server, is what this
 * compares against.
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
    if (random() < 0.15) {
      path = `${source}/${ICON_PATHS[Math.floor(random() * ICON_PATHS.length)]}`;
    }
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

const ICON_PATHS = [
  "favicon.ico",
  "icon.svg",
  "favicon.svg",
  "apple-touch-icon.png",
  "logo192.png",
];

/**
 * Next's answer for a URL, as the URL it rewrites to. When the website's
 * redirects send the URL somewhere first, it follows the one that only drops
 * a trailing slash (keeping the query); the audit follows any other redirect
 * live, so those return null and the caller skips them.
 */
async function nextRewrite(url: string) {
  const response = await unstable_getResponseFromNextConfig({
    url,
    nextConfig,
  });
  const redirect = getRedirectUrl(response);
  if (!redirect) return { compared: getRewrittenUrl(response), slash: false };
  const target = new URL(redirect, url);
  const slashless = new URL(url);
  slashless.pathname = slashless.pathname.replace(/\/+$/, "");
  if (normalized(target.toString()) !== normalized(slashless.toString())) {
    return null;
  }
  const followed = await unstable_getResponseFromNextConfig({
    url: target.toString(),
    nextConfig,
  });
  expect(getRedirectUrl(followed), target.toString()).toBeFalsy();
  return { compared: getRewrittenUrl(followed), slash: true };
}

describe("the direct-host audit's model of the zone rewrites", () => {
  const zones: AppZoneRoute[] = zoneRoutes(appZoneRewrites);

  test("covers every zone on a Vercel host", () => {
    expect(zones.length).toBeGreaterThan(40);
  });

  test(
    "proxies each URL where Next does, to the same zone URL",
    { timeout: DIFFERENTIAL_TIMEOUT_MS },
    async () => {
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
      let slashes = 0;
      let icons = 0;
      for (const source of sources) {
        for (const url of publicUrls(source, random)) {
          const next = await nextRewrite(url);
          if (!next) continue;
          compared += 1;
          if (next.slash) slashes += 1;
          const model = proxiedUrl(REWRITES, url);
          if (model && !isProductionVercelUrl(model.url)) icons += 1;
          expect(normalized(model?.url ?? null), url).toBe(
            normalized(next.compared),
          );
        }
      }
      expect(compared).toBeGreaterThan(zones.length * 10);
      // The trailing-slash and icon shapes each reached the comparison.
      expect(slashes).toBeGreaterThan(zones.length);
      expect(icons).toBeGreaterThan(zones.length / 2);
    },
  );
});

function isProductionVercelUrl(url: string) {
  return new URL(url).hostname.endsWith(".vercel.app");
}
