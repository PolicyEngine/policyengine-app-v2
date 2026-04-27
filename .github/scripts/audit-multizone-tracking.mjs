#!/usr/bin/env node
/**
 * Pre-merge guard against the multizone-tracking regression we hit in
 * April 2026: when /us/marriage was rewired from the main app to a
 * separate Vercel zone (PolicyEngine/marriage), that zone had no GA4
 * bootstrap — so every click silently lost both page_view and the
 * tool_engaged conversion event.
 *
 * This script parses website/next.config.ts, extracts every multizone
 * rewrite destination, fetches each one with a cache-busting query
 * string, and verifies the GA4 measurement ID appears in the served
 * HTML. If any destination is missing tracking, the script exits
 * non-zero and the PR check fails.
 *
 * Only checks user-facing destinations (HTML pages). Skips asset-proxy
 * rewrites (e.g. /_zones/...), API endpoints, and internal services
 * where tracking wouldn't apply.
 */
import { readFileSync } from "node:fs";

const GA_MEASUREMENT_ID = "G-2YHG89FY0N";
const NEXT_CONFIG = "website/next.config.ts";

// Destinations that are intentionally not user-facing pages — API
// endpoints, analytics proxies, static asset proxies. Matched as
// substrings against the destination URL. We still want to catch the
// interesting case (a new multizone frontend added without GA), not
// trip over every backend proxy.
const SKIP_IF_CONTAINS = [
  "/_zones/",            // Next.js zone asset proxy
  "/_tracker/",          // PostHog analytics proxy
  "/ingest",             // PostHog ingestion proxy
  "/api/",               // Backend API proxy
  "/robots.txt",
  "/sitemap.xml",
  ".modal.run",          // Modal-hosted backend services (not frontends)
  "posthog.com",         // PostHog itself
  "policyengine.github.io/plugin-blog",  // Legacy blog, not in ads
  "policyengine-slides.vercel.app",      // Internal slides, not in ads
];

// File extensions that indicate a static-asset proxy rather than a
// page. Static SVGs / images / fonts don't have a root layout to
// install gtag into.
const STATIC_ASSET_EXTS = [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf", ".css", ".js"];

// Pages that serve reference / documentation content where firing
// tool_engaged would inflate conversion counts. Allowed to have gtag
// but the test doesn't require tool_engaged there. Kept here for
// reference — the current check only verifies gtag presence, not
// whether tool_engaged fires (that's harder to test statically).
// const REFERENCE_CONTENT = ["policyengine-model", "household-api-docs"];

function extractRewriteDestinations(source) {
  // Matches: destination: "https://..." allowing single or double quotes.
  // Keeps destinations that look like full URLs to external hosts.
  const urlRegex = /destination:\s*["'`](https?:\/\/[^"'`]+)["'`]/g;
  const urls = new Set();
  let match;
  while ((match = urlRegex.exec(source)) !== null) {
    const url = match[1];
    if (SKIP_IF_CONTAINS.some((s) => url.includes(s))) continue;
    // Skip static-asset destinations — no layout, no gtag to install.
    const pathPart = url.split("?")[0];
    if (STATIC_ASSET_EXTS.some((ext) => pathPart.endsWith(ext))) continue;
    urls.add(url);
  }
  return Array.from(urls);
}

/**
 * Resolve the rewrite destination to the user-facing policyengine.org
 * URL it will serve, by finding the matching source in next.config.ts.
 * That's what users actually hit — we want to verify THAT URL renders
 * a page with tracking, not the underlying Vercel project URL (which
 * may respond differently outside the rewrite context).
 *
 * Returns null if the source path contains a parameter we can't
 * confidently concretize (e.g. dynamic multi-country routes where
 * the audit shouldn't guess a value). Callers skip those — one
 * representative concrete path per family is enough to catch the
 * failure mode.
 */
function resolveSourcePathForDestination(source, destinationUrl) {
  const pattern = new RegExp(
    `source:\\s*["'\`](/[^"'\`]+)["'\`]\\s*,\\s*destination:\\s*["'\`]${destinationUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`,
    "g",
  );
  const match = pattern.exec(source);
  if (!match) return null;
  const rawPath = match[1];

  // Strip catch-all suffix. Keep all-path variants out since they'd
  // usually map to arbitrary deep paths we can't test meaningfully.
  let resolved = rawPath.replace(/\/:path\*?$/, "");

  // Substitute known parameter placeholders with concrete values so
  // the URL is actually testable. :countryId is the only dynamic
  // param currently used for multizone sources; default to "us" which
  // every zone is expected to support.
  resolved = resolved.replace(/\/:countryId\b/, "/us");

  // Any remaining :param tokens mean this rewrite takes a value we
  // can't guess — skip rather than fabricate a path that 404s.
  if (/\/:[a-zA-Z]/.test(resolved)) return null;

  return resolved;
}

async function checkUrl(url) {
  const busted = `${url}${url.includes("?") ? "&" : "?"}_cb=${Date.now()}`;
  try {
    const res = await fetch(busted, {
      redirect: "follow",
      headers: { "Cache-Control": "no-cache", "User-Agent": "multizone-tracking-audit/1.0" },
    });
    if (!res.ok) {
      return { ok: false, reason: `HTTP ${res.status}`, status: res.status };
    }
    const html = await res.text();
    const hasGtagId = html.includes(GA_MEASUREMENT_ID);
    const hasGtagLoader = html.includes("googletagmanager.com/gtag/js");
    return {
      ok: hasGtagId && hasGtagLoader,
      reason: hasGtagId && hasGtagLoader
        ? "gtag present"
        : !hasGtagLoader
          ? "gtag loader missing"
          : "GA4 measurement ID missing",
      status: res.status,
    };
  } catch (e) {
    return { ok: false, reason: `fetch failed: ${e.message}` };
  }
}

const configText = readFileSync(NEXT_CONFIG, "utf8");
const destinations = extractRewriteDestinations(configText);

if (destinations.length === 0) {
  console.log("No multizone rewrites found in", NEXT_CONFIG);
  process.exit(0);
}

console.log(`Found ${destinations.length} multizone destination(s) to audit.\n`);

const results = [];
const skipped = [];
for (const destination of destinations) {
  const sourcePath = resolveSourcePathForDestination(configText, destination);
  if (!sourcePath) {
    // Rewrite has a parameter we can't safely concretize; skip rather
    // than test a fabricated URL. The :countryId version (resolved to
    // /us/...) usually covers the same destination zone.
    skipped.push(destination);
    continue;
  }
  const testUrl = `https://policyengine.org${sourcePath}`;
  let result = await checkUrl(testUrl);
  // If policyengine.org returns 404, the rewrite likely hasn't been
  // deployed yet (e.g. this PR adds it). Fall back to testing the
  // destination URL directly — what we care about is whether the
  // destination zone has gtag, not whether the rewrite is live.
  let testedDestinationDirectly = false;
  if (!result.ok && result.status === 404) {
    const stripped = destination.replace(/\/:path\*?$/, "");
    const fallback = await checkUrl(stripped);
    if (fallback.ok || fallback.status !== 404) {
      result = fallback;
      testedDestinationDirectly = true;
    }
  }
  results.push({ destination, testUrl, ...result });
  const mark = result.ok ? "✓" : "✗";
  console.log(`${mark} ${testUrl}`);
  console.log(`    ${result.reason}`);
  if (testedDestinationDirectly) console.log(`    (tested destination directly — rewrite not yet live on production)`);
  if (destination !== testUrl) console.log(`    (rewrites to ${destination})`);
}

if (skipped.length > 0) {
  console.log(`\n${skipped.length} destination(s) skipped (dynamic source, tested via concretized sibling):`);
  skipped.forEach((s) => console.log(`  - ${s}`));
}

const failures = results.filter((r) => !r.ok);
console.log(`\n${results.length - failures.length}/${results.length} destinations have tracking.`);

if (failures.length > 0) {
  console.error(`\n❌ ${failures.length} destination(s) missing Google Analytics bootstrap:\n`);
  failures.forEach((f) => {
    console.error(`  - ${f.testUrl} (${f.reason})`);
    console.error(`    → destination: ${f.destination}`);
  });
  console.error("\nEvery multizone page served from policyengine.org must have the GA4");
  console.error("bootstrap (gtag.js + config('G-2YHG89FY0N')) in its root layout.");
  console.error("Without it, page_view and tool_engaged events silently drop, and");
  console.error("Google Ads stops reporting conversions for any keyword landing there.");
  console.error("");
  console.error("Fix: in the destination repo, add the same gtag setup that");
  console.error("website/src/app/layout.tsx uses. See PolicyEngine/marriage#114 or");
  console.error("PolicyEngine/policyengine-model#21 for example PRs.");
  process.exit(1);
}

console.log("\n✅ All multizone destinations have tracking.");
