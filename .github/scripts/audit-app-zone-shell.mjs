#!/usr/bin/env node
/**
 * Audits production app-zone routes for the PolicyEngine site shell.
 *
 * This catches the multizone failure mode where a child app renders under
 * policyengine.org but loses the PolicyEngine header/nav after a framework
 * migration. It intentionally checks the public source URL first; if a newly
 * added rewrite is not deployed on production yet, it falls back to the
 * destination URL when possible.
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = "https://policyengine.org";
const DEFAULT_ROUTES_FILE = "website/src/data/appZoneRoutes.ts";
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_TIMEOUT_MS = 30000;

const SKIP_IF_DESTINATION_CONTAINS = [
  ".modal.run",
  "/_zones/",
  "/api/",
  "/robots.txt",
  "/sitemap.xml",
];

const ERROR_PATTERNS = [
  /Application error/i,
  /Unhandled Runtime Error/i,
  /This page could not be found/i,
  /404: This page could not be found/i,
  /Internal Server Error/i,
];

const REQUIRED_NAV_LABELS = ["Research", "Model", "API", "Donate"];

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const value = argv[i + 1]?.startsWith("--") ? undefined : argv[i + 1];
    if (value !== undefined) i += 1;
    options[key] = value ?? true;
  }
  return options;
}

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

function resolveUrl(baseUrl, href) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${trimTrailingSlash(baseUrl)}${href.startsWith("/") ? href : `/${href}`}`;
}

function normalizeSource(source) {
  if (source.includes("/:path")) return null;
  const resolved = source.replace(/\/:countryId\b/, "/us");
  if (/\/:[a-zA-Z]/.test(resolved)) return null;
  return resolved;
}

function extractRoutes(source) {
  const routeRegex =
    /\{\s*source:\s*"([^"]+)"[\s\S]*?destination:\s*"([^"]+)"[\s\S]*?\}/g;
  const routes = new Map();
  let match;

  while ((match = routeRegex.exec(source)) !== null) {
    const sourcePath = normalizeSource(match[1]);
    const destination = match[2];
    if (!sourcePath) continue;
    if (SKIP_IF_DESTINATION_CONTAINS.some((part) => destination.includes(part))) {
      continue;
    }

    routes.set(sourcePath, {
      source: sourcePath,
      destination,
    });
  }

  return Array.from(routes.values()).sort((a, b) =>
    a.source.localeCompare(b.source),
  );
}

function cacheBust(url) {
  return `${url}${url.includes("?") ? "&" : "?"}_shell_audit=${Date.now()}`;
}

function hasErrorText(bodyText) {
  return ERROR_PATTERNS.find((pattern) => pattern.test(bodyText));
}

async function inspectShell(page, url, timeout) {
  let response;

  try {
    response = await page.goto(cacheBust(url), {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
  } catch (error) {
    return { ok: false, status: null, reason: `navigation failed: ${error.message}` };
  }

  const status = response?.status() ?? null;
  if (status && status >= 400) {
    return { ok: false, status, reason: `HTTP ${status}` };
  }

  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(
    () => "",
  );
  if (bodyText.trim().length < 50) {
    return { ok: false, status, reason: "empty or nearly empty page" };
  }

  const errorPattern = hasErrorText(bodyText);
  if (errorPattern) {
    return {
      ok: false,
      status,
      reason: `error text matched ${errorPattern.toString()}`,
    };
  }

  const navHits = REQUIRED_NAV_LABELS.filter((label) => bodyText.includes(label));
  const logoCount = await page
    .locator('img[alt*="PolicyEngine" i], [aria-label*="PolicyEngine" i]')
    .count()
    .catch(() => 0);
  const hasBrand = logoCount > 0 || bodyText.includes("PolicyEngine");

  if (!hasBrand) {
    return { ok: false, status, reason: "PolicyEngine brand missing" };
  }

  if (navHits.length < REQUIRED_NAV_LABELS.length) {
    return {
      ok: false,
      status,
      reason: `nav labels missing: ${REQUIRED_NAV_LABELS.filter(
        (label) => !navHits.includes(label),
      ).join(", ")}`,
    };
  }

  return { ok: true, status, reason: "PolicyEngine shell present" };
}

async function auditRoute(browser, route, baseUrl, timeout) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    userAgent: "policyengine-app-zone-shell-audit/1.0",
  });
  const sourceUrl = resolveUrl(baseUrl, route.source);
  let result = await inspectShell(page, sourceUrl, timeout);
  let testedUrl = sourceUrl;
  let usedFallback = false;

  if (!result.ok && result.status === 404) {
    const destinationUrl = resolveUrl(baseUrl, route.destination);
    const fallbackResult = await inspectShell(page, destinationUrl, timeout);
    if (fallbackResult.ok || fallbackResult.status !== 404) {
      result = fallbackResult;
      testedUrl = destinationUrl;
      usedFallback = true;
    }
  }

  await page.close();
  return { ...route, ...result, testedUrl, sourceUrl, usedFallback };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => runWorker(),
    ),
  );
  return results;
}

const args = parseArgs(process.argv.slice(2));
const routesFile = args["routes-file"] ?? DEFAULT_ROUTES_FILE;
const baseUrl =
  args["base-url"] ?? process.env.APP_ZONE_SHELL_AUDIT_BASE_URL ?? DEFAULT_BASE_URL;
const concurrency = Number(args.concurrency ?? DEFAULT_CONCURRENCY);
const timeout = Number(args.timeout ?? DEFAULT_TIMEOUT_MS);

const routeSource = readFileSync(routesFile, "utf8");
const routes = extractRoutes(routeSource);

if (routes.length === 0) {
  console.log(`No app-zone routes found in ${routesFile}`);
  process.exit(0);
}

console.log(`Auditing ${routes.length} app-zone route(s) for PolicyEngine shell.`);
console.log(`Base URL: ${baseUrl}\n`);

const browser = await chromium.launch();
const results = await runWithConcurrency(routes, concurrency, async (route) => {
  const result = await auditRoute(browser, route, baseUrl, timeout);
  const mark = result.ok ? "OK" : "FAIL";
  console.log(`${mark} ${result.source}`);
  console.log(`    ${result.reason}`);
  if (result.usedFallback) {
    console.log("    tested destination directly because source returned 404");
  }
  if (result.testedUrl !== result.sourceUrl) {
    console.log(`    tested ${result.testedUrl}`);
  }
  return result;
});
await browser.close();

const failures = results.filter((result) => !result.ok);
console.log(`\n${results.length - failures.length}/${results.length} app-zone routes have the PolicyEngine shell.`);

if (failures.length > 0) {
  console.error("\nRoutes missing the PolicyEngine shell:");
  for (const failure of failures) {
    console.error(`  - ${failure.source}: ${failure.reason}`);
    console.error(`    source: ${failure.sourceUrl}`);
    console.error(`    destination: ${failure.destination}`);
  }
  console.error("\nChild apps served through policyengine.org should render the");
  console.error("PolicyEngine header/nav themselves. Multizone rewrites do not");
  console.error("inject the parent app shell into the child response.");
  process.exit(1);
}

console.log("\nAll audited app-zone routes render the PolicyEngine shell.");
