#!/usr/bin/env node
/**
 * Audits production app-zone routes for the PolicyEngine site shell.
 *
 * This catches the multizone failure mode where a child app renders under
 * policyengine.org but loses the PolicyEngine header/nav after a framework
 * migration. Production audits check the public source URL; pull requests can
 * opt into destination fallback for newly added rewrites that are not live yet.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "https://policyengine.org";
const DEFAULT_ROUTES_FILE = "website/src/data/appZoneRoutes.ts";
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_SITEMAP_ROUTES = 30;

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

export const REQUIRED_NAV_LABELS = ["Research", "Model", "API", "Donate"];
const TOP_SHELL_SELECTOR =
  'header, nav, [data-testid*="header" i], [data-testid*="site-header" i], a, button, img, [aria-label]';

// Routes intentionally served WITHOUT a child-rendered PolicyEngine header.
// These tools are embedded under policyengine.org, which already provides the
// site header/nav, so the maintainers chose not to duplicate the PolicyEngine
// shell inside the child app. These routes are still audited for liveness
// (HTTP status, runtime errors, blank pages) — only the top-shell brand/nav
// assertion is skipped. Remove an entry to re-enforce the full shell on it.
//   /uk/scotland-income-tax-reform — PolicyEngine/scotland-income-tax-reform#8
//   /uk/student-loan-visualisation — PolicyEngine/student-loan-visualisation#3
//   /us/obbba-household-explorer    — PolicyEngine/obbba-household-by-household#240
//   /uk/uc-rebalancing              — PolicyEngine/uc-rebalancing
//   /uk/cancelling-fuel-duty-rise   — PolicyEngine/cancelling-fuel-duty-rise
export const SHELL_BRAND_EXEMPT_SOURCES = [
  "/uk/scotland-income-tax-reform",
  "/uk/student-loan-visualisation",
  "/us/obbba-household-explorer",
  "/uk/uc-rebalancing",
  "/uk/cancelling-fuel-duty-rise",
];

export function isShellBrandExempt(source) {
  return SHELL_BRAND_EXEMPT_SOURCES.some(
    (base) => source === base || source.startsWith(`${base}/`),
  );
}

export function parseArgs(argv) {
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

function trimTrailingPath(path) {
  return path.replace(/\/+$/, "") || "/";
}

function joinPaths(basePath, suffix) {
  const base = trimTrailingPath(basePath);
  if (!suffix) return base;
  if (base === "/") return suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

function resolveUrl(baseUrl, href) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return `${trimTrailingSlash(baseUrl)}${href.startsWith("/") ? href : `/${href}`}`;
}

function appendPath(url, path) {
  const parsed = new URL(url);
  parsed.pathname = joinPaths(parsed.pathname, path);
  return parsed.toString();
}

function normalizeSource(source) {
  if (source.includes("/:path")) return null;
  const resolved = source.replace(/\/:countryId\b/, "/us");
  if (/\/:[a-zA-Z]/.test(resolved)) return null;
  return resolved;
}

export function extractRoutes(source) {
  const routeRegex =
    /\{\s*source:\s*"([^"]+)"[\s\S]*?destination:\s*"([^"]+)"[\s\S]*?\}/g;
  const routes = new Map();
  let match;

  while ((match = routeRegex.exec(source)) !== null) {
    const routeBlock = match[0];
    const sourcePath = normalizeSource(match[1]);
    const destination = match[2];
    const deepDestination = routeBlock.match(
      /deepDestination:\s*"([^"]+)"/,
    )?.[1];
    if (!sourcePath) continue;
    if (SKIP_IF_DESTINATION_CONTAINS.some((part) => destination.includes(part))) {
      continue;
    }

    routes.set(sourcePath, {
      source: sourcePath,
      destination,
      ...(deepDestination ? { deepDestination } : {}),
    });
  }

  return Array.from(routes.values()).sort((a, b) =>
    a.source.localeCompare(b.source),
  );
}

function cacheBust(url) {
  return `${url}${url.includes("?") ? "&" : "?"}_shell_audit=${Date.now()}`;
}

function isSameOrNestedPath(path, basePath) {
  const base = trimTrailingPath(basePath);
  if (base === "/") return path.startsWith("/");
  return path === base || path.startsWith(`${base}/`);
}

function templateBasePath(pathname) {
  const markerIndex = pathname.indexOf("/:path*");
  if (markerIndex === -1) return trimTrailingPath(pathname);
  return trimTrailingPath(pathname.slice(0, markerIndex));
}

function pathSuffix(path, basePath) {
  const base = trimTrailingPath(basePath);
  if (base === "/") return path;
  return path.slice(base.length);
}

function searchWithoutTemplateParams(locUrl, templateUrl) {
  const searchParams = new URLSearchParams(locUrl.search);

  for (const [key, value] of templateUrl.searchParams) {
    const values = searchParams.getAll(key);
    let removedTemplateValue = false;
    searchParams.delete(key);

    for (const candidate of values) {
      if (!removedTemplateValue && candidate === value) {
        removedTemplateValue = true;
        continue;
      }
      searchParams.append(key, candidate);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function sourcePathFromDestinationUrl(locUrl, destinationUrl, route, basePath) {
  if (
    locUrl.origin !== destinationUrl.origin ||
    !isSameOrNestedPath(locUrl.pathname, basePath)
  ) {
    return null;
  }

  const suffix = pathSuffix(locUrl.pathname, basePath);
  const search = searchWithoutTemplateParams(locUrl, destinationUrl);
  return `${trimTrailingPath(route.source)}${suffix}${search}${locUrl.hash}`;
}

export function sourcePathFromSitemapLoc(loc, route, baseUrl) {
  let locUrl;
  try {
    locUrl = new URL(loc.replaceAll("&amp;", "&"));
  } catch {
    return null;
  }

  const sourceUrl = new URL(resolveUrl(baseUrl, route.source));
  const destinationUrl = new URL(resolveUrl(baseUrl, route.destination));
  const deepDestinationUrl = route.deepDestination
    ? new URL(resolveUrl(baseUrl, route.deepDestination))
    : null;

  if (
    locUrl.origin === sourceUrl.origin &&
    isSameOrNestedPath(locUrl.pathname, sourceUrl.pathname)
  ) {
    return `${locUrl.pathname}${locUrl.search}${locUrl.hash}`;
  }

  const sourceFromBaseDestination = sourcePathFromDestinationUrl(
    locUrl,
    destinationUrl,
    route,
    trimTrailingPath(destinationUrl.pathname),
  );
  if (sourceFromBaseDestination) return sourceFromBaseDestination;

  if (deepDestinationUrl) {
    const sourceFromDeepDestination = sourcePathFromDestinationUrl(
      locUrl,
      deepDestinationUrl,
      route,
      templateBasePath(deepDestinationUrl.pathname),
    );
    if (sourceFromDeepDestination) return sourceFromDeepDestination;
  }

  return null;
}

function mergeSourceSearch(destinationUrl, sourceUrl) {
  for (const [key, value] of sourceUrl.searchParams) {
    destinationUrl.searchParams.append(key, value);
  }
}

export function resolveDestinationForSource(route, sourcePath, baseUrl) {
  const sourceUrl = new URL(resolveUrl(baseUrl, sourcePath));
  const routeSourceBase = trimTrailingPath(route.source);
  const suffix =
    routeSourceBase === "/"
      ? sourceUrl.pathname
      : pathSuffix(sourceUrl.pathname, routeSourceBase);

  const destinationTemplate =
    suffix && route.deepDestination ? route.deepDestination : route.destination;
  const destinationUrl = new URL(resolveUrl(baseUrl, destinationTemplate));

  if (suffix) {
    if (destinationUrl.pathname.includes("/:path*")) {
      destinationUrl.pathname = destinationUrl.pathname.replace(
        ":path*",
        suffix.replace(/^\/+/, ""),
      );
    } else {
      destinationUrl.pathname = joinPaths(destinationUrl.pathname, suffix);
    }
  }

  mergeSourceSearch(destinationUrl, sourceUrl);
  destinationUrl.hash = sourceUrl.hash;
  return destinationUrl.toString();
}

export function extractSitemapLocs(xml) {
  const locs = [];
  const locRegex = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    locs.push(match[1]);
  }
  return locs;
}

async function fetchText(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(cacheBust(url), {
      headers: {
        "Cache-Control": "no-cache",
        "User-Agent": "policyengine-app-zone-shell-audit/1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function discoverSitemapRoutes(
  route,
  baseUrl,
  timeout,
  allowDestinationFallback,
  maxSitemapRoutes,
) {
  const sitemapUrls = [appendPath(resolveUrl(baseUrl, route.source), "/sitemap.xml")];
  if (allowDestinationFallback) {
    sitemapUrls.push(appendPath(resolveUrl(baseUrl, route.destination), "/sitemap.xml"));
  }

  const discovered = new Map();

  for (const sitemapUrl of sitemapUrls) {
    const xml = await fetchText(sitemapUrl, timeout);
    if (!xml) continue;

    for (const loc of extractSitemapLocs(xml)) {
      const source = sourcePathFromSitemapLoc(loc, route, baseUrl);
      if (!source || source === route.source || discovered.has(source)) continue;

      discovered.set(source, {
        source,
        destination: resolveDestinationForSource(route, source, baseUrl),
        discoveredFromSitemap: sitemapUrl,
      });

      if (discovered.size >= maxSitemapRoutes) break;
    }
  }

  return Array.from(discovered.values()).sort((a, b) =>
    a.source.localeCompare(b.source),
  );
}

async function expandRoutesWithSitemaps(
  routes,
  baseUrl,
  timeout,
  concurrency,
  allowDestinationFallback,
  maxSitemapRoutes,
) {
  const expanded = new Map(routes.map((route) => [route.source, route]));
  const discoveredGroups = await runWithConcurrency(
    routes,
    concurrency,
    (route) =>
      discoverSitemapRoutes(
        route,
        baseUrl,
        timeout,
        allowDestinationFallback,
        maxSitemapRoutes,
      ),
  );

  for (const route of discoveredGroups.flat()) {
    expanded.set(route.source, route);
  }

  return Array.from(expanded.values()).sort((a, b) =>
    a.source.localeCompare(b.source),
  );
}

function hasErrorText(bodyText) {
  return ERROR_PATTERNS.find((pattern) => pattern.test(bodyText));
}

export function inspectTopShellData(
  elements,
  requiredNavLabels = REQUIRED_NAV_LABELS,
  topLimit = 140,
) {
  const parts = [];

  for (const element of elements) {
    const { rect, style } = element;

    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.bottom < 0 ||
      rect.top > topLimit ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      continue;
    }

    parts.push(element.textContent ?? "", element.ariaLabel ?? "", element.alt ?? "");
  }

  const text = parts.join("\n").replace(/\s+/g, " ").trim();
  return {
    hasBrand: /\bPolicyEngine\b/i.test(text),
    navHits: requiredNavLabels.filter((label) => text.includes(label)),
  };
}

async function inspectTopShell(page) {
  const elements = await page.evaluate((selector) => {
    const candidates = Array.from(document.querySelectorAll(selector));

    return candidates.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return {
        textContent: element.textContent ?? "",
        ariaLabel: element.getAttribute("aria-label") ?? "",
        alt: element.getAttribute("alt") ?? "",
        rect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          bottom: rect.bottom,
        },
        style: {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
        },
      };
    });
  }, TOP_SHELL_SELECTOR);

  return inspectTopShellData(elements);
}

async function inspectShell(page, url, timeout, enforceShell = true) {
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

  if (!enforceShell) {
    return {
      ok: true,
      status,
      reason: "loaded — exempt from PolicyEngine shell brand/nav check",
      exempt: true,
    };
  }

  const { hasBrand, navHits } = await inspectTopShell(page);

  if (!hasBrand) {
    return {
      ok: false,
      status,
      reason: "PolicyEngine brand missing from top shell",
    };
  }

  if (navHits.length < REQUIRED_NAV_LABELS.length) {
    return {
      ok: false,
      status,
      reason: `top shell nav labels missing: ${REQUIRED_NAV_LABELS.filter(
        (label) => !navHits.includes(label),
      ).join(", ")}`,
    };
  }

  return { ok: true, status, reason: "PolicyEngine shell present" };
}

async function auditRoute(browser, route, baseUrl, timeout, allowDestinationFallback) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    userAgent: "policyengine-app-zone-shell-audit/1.0",
  });
  const enforceShell = !isShellBrandExempt(route.source);
  const sourceUrl = resolveUrl(baseUrl, route.source);
  let result = await inspectShell(page, sourceUrl, timeout, enforceShell);
  let testedUrl = sourceUrl;
  let usedFallback = false;

  if (!result.ok && result.status === 404 && allowDestinationFallback) {
    const destinationUrl = resolveUrl(baseUrl, route.destination);
    const fallbackResult = await inspectShell(
      page,
      destinationUrl,
      timeout,
      enforceShell,
    );
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

export function shouldAllowDestinationFallback(args, env = process.env) {
  return (
    args["allow-destination-fallback"] === true ||
    env.APP_ZONE_ALLOW_DESTINATION_FALLBACK === "1" ||
    env.GITHUB_EVENT_NAME === "pull_request"
  );
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  const routesFile = args["routes-file"] ?? DEFAULT_ROUTES_FILE;
  const baseUrl =
    args["base-url"] ?? env.APP_ZONE_SHELL_AUDIT_BASE_URL ?? DEFAULT_BASE_URL;
  const concurrency = Number(args.concurrency ?? DEFAULT_CONCURRENCY);
  const timeout = Number(args.timeout ?? DEFAULT_TIMEOUT_MS);
  const maxSitemapRoutes = Number(
    args["max-sitemap-routes"] ?? DEFAULT_MAX_SITEMAP_ROUTES,
  );
  const allowDestinationFallback = shouldAllowDestinationFallback(args, env);

  const routeSource = readFileSync(routesFile, "utf8");
  const baseRoutes = extractRoutes(routeSource);

  if (baseRoutes.length === 0) {
    console.log(`No app-zone routes found in ${routesFile}`);
    return 0;
  }

  const routes = await expandRoutesWithSitemaps(
    baseRoutes,
    baseUrl,
    timeout,
    concurrency,
    allowDestinationFallback,
    maxSitemapRoutes,
  );

  console.log(`Auditing ${routes.length} app-zone route(s) for PolicyEngine shell.`);
  console.log(`Base URL: ${baseUrl}\n`);
  if (routes.length > baseRoutes.length) {
    console.log(
      `Expanded ${baseRoutes.length} configured route(s) with ${routes.length - baseRoutes.length} sitemap subroute(s).\n`,
    );
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const results = await runWithConcurrency(routes, concurrency, async (route) => {
    const result = await auditRoute(
      browser,
      route,
      baseUrl,
      timeout,
      allowDestinationFallback,
    );
    const mark = result.ok ? (result.exempt ? "SKIP" : "OK") : "FAIL";
    console.log(`${mark} ${result.source}`);
    console.log(`    ${result.reason}`);
    if (result.usedFallback) {
      console.log("    tested destination directly because source returned 404");
    }
    if (result.discoveredFromSitemap) {
      console.log(`    discovered from ${result.discoveredFromSitemap}`);
    }
    if (result.testedUrl !== result.sourceUrl) {
      console.log(`    tested ${result.testedUrl}`);
    }
    return result;
  });
  await browser.close();

  const failures = results.filter((result) => !result.ok);
  const exempt = results.filter((result) => result.exempt);
  const enforced = results.length - exempt.length;
  console.log(`\n${enforced - failures.length}/${enforced} enforced app-zone routes have the PolicyEngine shell.`);

  if (exempt.length > 0) {
    console.log(`\n${exempt.length} route(s) skipped the PolicyEngine shell brand/nav check (loaded OK, header intentionally omitted):`);
    for (const route of exempt) {
      console.log(`  - ${route.source}`);
    }
  }

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
    return 1;
  }

  console.log("\nAll audited app-zone routes render the PolicyEngine shell.");
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
