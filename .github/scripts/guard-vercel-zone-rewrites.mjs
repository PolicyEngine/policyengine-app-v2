#!/usr/bin/env node
/**
 * Guards `vercel.json` against new multizone-shaped rewrites.
 *
 * Multizone routes belong in `website/src/data/appZoneRoutes.ts` so they
 * flow through `website/next.config.ts`'s `beforeFiles` and get audited
 * by `app-zone-shell-audit` and `multizone-tracking-audit`. Anything
 * added to `vercel.json` bypasses both.
 *
 * A handful of legacy entries predate the multizone migration and are
 * grandfathered via LEGACY_VERCEL_JSON_ZONE_SLUGS. **Do not add new
 * slugs to that set** — when a legacy entry gets migrated to
 * `appZoneRoutes.ts`, the slug should be removed from the set in the
 * same PR.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_VERCEL_JSON = "vercel.json";

// Slugs whose vercel.json zone rewrites exist on `main` today. Any
// rewrite outside this set will be flagged. Shrink as legacy entries
// move to appZoneRoutes.ts.
export const LEGACY_VERCEL_JSON_ZONE_SLUGS = new Set([
  "api",
  "california-wealth-tax",
  "keep-your-pay-act",
  "model",
  "oregon-kicker-refund",
  "taxsim",
  "watca",
]);

/**
 * Return the zone slug for a rewrite source, or null if the source
 * isn't shaped like a country-prefixed multizone route.
 *
 *   /us/taxsim                  -> "taxsim"
 *   /us/taxsim/:path*           -> "taxsim"
 *   /uk/api/                    -> "api"
 *   /:countryId/model/:path*    -> "model"
 *   /us/california-wealth-tax/embed -> "california-wealth-tax"
 *   /robots.txt                 -> null
 *   /slides/:path*              -> null  (top-level zone, not country)
 *   /(.*)                       -> null  (SPA catch-all)
 */
export function extractZoneSlug(source) {
  if (typeof source !== "string") return null;
  // First segment is a literal country (us/uk) or a Next.js parameter
  // standing in for one (typically :countryId, but accept any :name
  // since the shape is what matters).
  const match = source.match(/^\/(?:us|uk|:[A-Za-z_]\w*)\/([A-Za-z0-9][A-Za-z0-9-]*)/);
  return match ? match[1] : null;
}

/**
 * A rewrite is "zone-shaped" if its source has a country prefix and
 * its destination points at a vercel.app host.
 */
export function isZoneShaped(rewrite) {
  if (!rewrite || typeof rewrite.destination !== "string") return false;
  if (!extractZoneSlug(rewrite.source)) return false;
  try {
    const url = new URL(rewrite.destination);
    return url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function findUnauthorizedZoneRewrites(rewrites, allowedSlugs = LEGACY_VERCEL_JSON_ZONE_SLUGS) {
  if (!Array.isArray(rewrites)) return [];
  return rewrites
    .filter(isZoneShaped)
    .filter((rewrite) => !allowedSlugs.has(extractZoneSlug(rewrite.source)));
}

function formatRewrite({ source, destination }) {
  return `  - ${source} -> ${destination}`;
}

async function main(argv = process.argv.slice(2)) {
  const path = argv[0] || DEFAULT_VERCEL_JSON;
  const raw = readFileSync(path, "utf8");
  const config = JSON.parse(raw);
  const unauthorized = findUnauthorizedZoneRewrites(config.rewrites);

  if (unauthorized.length === 0) {
    console.log(`${path}: no unauthorized zone-shaped rewrites.`);
    return 0;
  }

  console.error(`${path} has zone-shaped rewrites that bypass the multizone audit:\n`);
  for (const rewrite of unauthorized) {
    console.error(formatRewrite(rewrite));
  }
  console.error(
    `\nNew multizone routes go in website/src/data/appZoneRoutes.ts so they\n` +
      `flow through website/next.config.ts beforeFiles and get covered by\n` +
      `the app-zone-shell-audit and multizone-tracking-audit checks. The\n` +
      `legacy vercel.json entries are tracked for migration; do not add to\n` +
      `them. See CLAUDE.md "Embedded sites".`,
  );
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code));
}
