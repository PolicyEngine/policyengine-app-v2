#!/usr/bin/env node
/**
 * Audits what a reader gets when they visit a zone's production Vercel host
 * directly instead of its policyengine.org route.
 *
 * policyengine.org proxies each route in appZoneRoutes.ts to a `*.vercel.app`
 * host, so that host serves the same page outside the site. A zone redirects
 * direct visits back to policyengine.org (docs/engineering/skills/
 * repository-guidance.md → The direct-host redirect). This audit probes each
 * zone's host the way a reader with an old link would and checks that:
 *
 * - every source in DIRECT_HOST_REDIRECTS still redirects;
 * - every redirect, listed or not, is permanent, names a policyengine.org URL
 *   that policyengine.org proxies back to the page asked for (path and query
 *   kept), and that URL answers 200 without looping back;
 * - no research article iframes a host that redirects.
 *
 * Zones with no redirect yet are reported, not failed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  extractRoutes,
  parseArgs,
  resolveDestinationForSource,
} from "./audit-app-zone-shell.mjs";

const DEFAULT_ROUTES_FILE = "website/src/data/appZoneRoutes.ts";
const DEFAULT_ARTICLES_DIR = "app/src/data/posts/articles";
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_HOPS = 5;

export const PUBLIC_ORIGIN = "https://www.policyengine.org";
export const PROBE_PARAM = "pe_direct_host_audit";
export const DEEP_PROBE_SEGMENT = "direct-host-audit";
const PERMANENT_STATUSES = new Set([301, 308]);

/**
 * Sources whose production host redirects direct visits to policyengine.org.
 * Only add to this list: the audit fails if any of these stops redirecting,
 * so a zone can't silently go back to serving its pages off the site.
 */
export const DIRECT_HOST_REDIRECTS = [];

/** The site's hosts: its own, and the apex domain for a www origin (the apex 307s to www). */
function publicHosts(publicOrigin) {
  const { hostname } = new URL(publicOrigin);
  return new Set([hostname, hostname.replace(/^www\./, "")]);
}

function trimTrailingPath(path) {
  return path.replace(/\/+$/, "") || "/";
}

/** Whether policyengine.org proxies the route to a `*.vercel.app` host (some destinations are its own static files). */
export function isProductionVercelHost(destination) {
  return URL.canParse(destination)
    ? new URL(destination).hostname.endsWith(".vercel.app")
    : false;
}

/**
 * The distinct key=value pairs of a query. A rewrite whose destination
 * carries a query (`?country=uk`) can repeat a pair the visitor sent too,
 * which changes nothing a page reads.
 */
function queryPairs(searchParams) {
  return [
    ...new Set(Array.from(searchParams, ([key, value]) => `${key}=${value}`)),
  ].sort();
}

function sameParams(a, b) {
  const left = queryPairs(a.searchParams);
  const right = queryPairs(b.searchParams);
  return (
    left.length === right.length &&
    left.every((pair, index) => pair === right[index])
  );
}

/**
 * The two URLs a reader could hold for a route: its root, which must serve a
 * page, and a path under it, which no zone serves. The second checks that the
 * redirect keeps the path; its target answers whatever the zone answers for
 * an unknown page, typically 404.
 */
export function probePaths(route) {
  const deep =
    route.source === "/"
      ? `/${DEEP_PROBE_SEGMENT}`
      : `${route.source}/${DEEP_PROBE_SEGMENT}`;
  return [
    { path: `${route.source}?${PROBE_PARAM}=1`, requirePage: true },
    { path: `${deep}?${PROBE_PARAM}=1`, requirePage: false },
  ];
}

/** The route policyengine.org would serve `pathname` from: the longest source that contains it. */
export function routeForPublicPath(routes, pathname) {
  const path = trimTrailingPath(pathname);
  let best = null;
  for (const route of routes) {
    const base = trimTrailingPath(route.source);
    const contains =
      base === "/" || path === base || path.startsWith(`${base}/`);
    if (contains && (!best || base.length > best.source.length)) best = route;
  }
  return best;
}

/**
 * Whether a redirect from `directUrl` to `location` keeps the reader on the
 * same page: policyengine.org proxies `location` back to `directUrl`, path
 * and query alike.
 */
export function redirectKeepsPage(
  routes,
  directUrl,
  location,
  publicOrigin = PUBLIC_ORIGIN,
) {
  const direct = new URL(directUrl);
  const target = new URL(location, direct);
  if (!publicHosts(publicOrigin).has(target.hostname)) {
    return { ok: false, reason: `redirects off ${publicOrigin} to ${target}` };
  }

  const route = routeForPublicPath(routes, target.pathname);
  if (!route) {
    return { ok: false, reason: `no zone route serves ${target.pathname}` };
  }

  const proxied = new URL(
    resolveDestinationForSource(
      route,
      `${trimTrailingPath(target.pathname)}${target.search}`,
      publicOrigin,
    ),
  );
  if (
    proxied.host !== direct.host ||
    trimTrailingPath(proxied.pathname) !== trimTrailingPath(direct.pathname) ||
    !sameParams(proxied, direct)
  ) {
    return {
      ok: false,
      reason: `${target} serves ${proxied}, not ${direct}`,
    };
  }
  return { ok: true, apex: target.hostname !== new URL(publicOrigin).hostname };
}

async function request(fetchImpl, url, timeout) {
  const response = await fetchImpl(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(timeout),
    headers: { "user-agent": "PolicyEngine zone direct-host audit" },
  });
  return {
    status: response.status,
    location: response.headers.get("location"),
  };
}

/**
 * Follows `url` hop by hop. `stop(url)` ends the walk early (for example on
 * leaving the starting host); a revisited URL or more than MAX_HOPS is a loop.
 */
async function walk(fetchImpl, url, timeout, stop = () => false) {
  const visited = [];
  let current = url;
  for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
    if (visited.includes(current)) return { loop: true, visited };
    visited.push(current);
    const { status, location } = await request(fetchImpl, current, timeout);
    if (status < 300 || status >= 400 || !location) {
      return { status, url: current, visited };
    }
    const next = new URL(location, current).toString();
    if (stop(next)) return { status, url: current, location: next, visited };
    current = next;
  }
  return { loop: true, visited };
}

/**
 * Probes one public path: the direct visit (following same-host hops such as
 * a trailing-slash redirect) and, when it redirects, the URL it names. With
 * `requirePage`, that URL must answer 200.
 */
export async function probeDirectHost(
  routes,
  route,
  publicPath,
  {
    fetchImpl = fetch,
    timeout = DEFAULT_TIMEOUT_MS,
    publicOrigin = PUBLIC_ORIGIN,
    requirePage = true,
  } = {},
) {
  const directUrl = resolveDestinationForSource(
    route,
    publicPath,
    publicOrigin,
  );
  const host = new URL(directUrl).host;
  const direct = await walk(
    fetchImpl,
    directUrl,
    timeout,
    (next) => new URL(next).host !== host,
  );

  if (direct.loop) {
    return {
      state: "wrong",
      directUrl,
      reason: `loops on its own host: ${direct.visited.join(" -> ")}`,
    };
  }
  if (!direct.location) {
    return { state: "missing", directUrl, status: direct.status };
  }

  if (!PERMANENT_STATUSES.has(direct.status)) {
    return {
      state: "wrong",
      directUrl,
      reason: `answers ${direct.status}, not a permanent (308) redirect`,
    };
  }

  const kept = redirectKeepsPage(
    routes,
    directUrl,
    direct.location,
    publicOrigin,
  );
  if (!kept.ok) return { state: "wrong", directUrl, reason: kept.reason };

  const landed = await walk(fetchImpl, direct.location, timeout);
  if (landed.loop) {
    return {
      state: "wrong",
      directUrl,
      reason: `loops: ${landed.visited.join(" -> ")}`,
    };
  }
  if (requirePage && landed.status !== 200) {
    return {
      state: "wrong",
      directUrl,
      reason: `${direct.location} answers ${landed.status}`,
    };
  }
  if (new URL(landed.url).host === host) {
    return {
      state: "wrong",
      directUrl,
      reason: `${direct.location} sends readers back to ${host}`,
    };
  }

  return {
    state: "ok",
    directUrl,
    location: direct.location,
    sameHostHops: direct.visited.length - 1,
    apex: kept.apex,
  };
}

/** The production hosts each article's iframes load, keyed by article file. */
export function findIframedHosts(markdownByFile, hosts) {
  const found = [];
  const iframeSrc = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  for (const [file, markdown] of Object.entries(markdownByFile)) {
    for (const match of markdown.matchAll(iframeSrc)) {
      let hostname;
      try {
        hostname = new URL(match[1]).hostname;
      } catch {
        continue;
      }
      if (hosts.has(hostname)) found.push({ file, host: hostname });
    }
  }
  return found;
}

/**
 * Folds a route's probe results (root first, then a page under it) into one
 * verdict. A redirect that lands anywhere but the same page fails, listed or
 * not; a listed route fails once its root stops redirecting. A host that
 * redirects only some paths ("partial") is reported, not failed: readers on
 * the others still get the page, as before.
 */
export function summarizeRoute(route, probes, listed) {
  const wrong = probes.filter((probe) => probe.state === "wrong");
  const ok = probes.filter((probe) => probe.state === "ok");
  let state;
  if (wrong.length > 0) state = "wrong";
  else if (ok.length === probes.length) state = "ok";
  else if (ok.length === 0) state = "missing";
  else state = "partial";

  const fails = state === "wrong" || (listed && probes[0]?.state !== "ok");
  return { ...route, state, listed, fails, probes };
}

function readArticles(dir) {
  const markdownByFile = {};
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".md")) {
      markdownByFile[join(dir, name)] = readFileSync(join(dir, name), "utf8");
    }
  }
  return markdownByFile;
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
    Array.from({ length: Math.min(concurrency, items.length) }, () =>
      runWorker(),
    ),
  );
  return results;
}

export async function main(
  argv = process.argv.slice(2),
  { fetchImpl = fetch, directHostRedirects = DIRECT_HOST_REDIRECTS } = {},
) {
  const args = parseArgs(argv);
  const routesFile = args["routes-file"] ?? DEFAULT_ROUTES_FILE;
  const articlesDir = args["articles-dir"] ?? DEFAULT_ARTICLES_DIR;
  const concurrency = Number(args.concurrency ?? DEFAULT_CONCURRENCY);
  const timeout = Number(args.timeout ?? DEFAULT_TIMEOUT_MS);
  // Lets a test deployment that mirrors policyengine.org stand in for it.
  const publicOrigin = args["public-origin"] ?? PUBLIC_ORIGIN;

  const routes = extractRoutes(readFileSync(routesFile, "utf8"));
  const zones = routes.filter((route) =>
    isProductionVercelHost(route.destination),
  );
  const unknown = directHostRedirects.filter(
    (source) => !zones.some((route) => route.source === source),
  );

  console.log(
    `Probing the production Vercel hosts of ${zones.length} app-zone route(s) directly.\n`,
  );

  const results = await runWithConcurrency(
    zones,
    concurrency,
    async (route) => {
      const probes = [];
      for (const { path, requirePage } of probePaths(route)) {
        try {
          probes.push(
            await probeDirectHost(routes, route, path, {
              fetchImpl,
              timeout,
              publicOrigin,
              requirePage,
            }),
          );
        } catch (error) {
          probes.push({
            state: "wrong",
            directUrl: path,
            reason: `request failed: ${error.message}`,
          });
        }
      }
      return summarizeRoute(
        route,
        probes,
        directHostRedirects.includes(route.source),
      );
    },
  );

  const marks = { ok: "OK", partial: "PARTIAL", missing: "MISSING" };
  for (const result of results) {
    const mark = result.fails ? "FAIL" : marks[result.state];
    console.log(
      `${mark} ${result.source} (${new URL(result.destination).host})`,
    );
    for (const probe of result.probes) {
      if (probe.state === "wrong") {
        console.log(`    ${probe.directUrl}: ${probe.reason}`);
      } else if (probe.state === "ok" && probe.apex) {
        console.log(
          `    ${probe.directUrl}: redirects to the apex domain, which costs readers a hop to www`,
        );
      }
    }
    if (result.state === "partial") {
      for (const probe of result.probes) {
        if (probe.state === "missing") {
          console.log(`    ${probe.directUrl}: no redirect`);
        }
      }
    }
    if (result.listed && result.probes[0]?.state === "missing") {
      console.log(
        "    listed in DIRECT_HOST_REDIRECTS but no longer redirects",
      );
    }
  }

  const redirectingHosts = new Set(
    results
      .filter((result) => result.state !== "missing" || result.listed)
      .map((result) => new URL(result.destination).hostname),
  );
  const iframed = findIframedHosts(readArticles(articlesDir), redirectingHosts);

  const ok = results.filter((result) => result.state === "ok");
  const missing = results.filter((result) => result.state === "missing");
  const failures = results.filter((result) => result.fails);
  const unlisted = results.filter(
    (result) =>
      !result.listed && !result.fails && result.probes[0]?.state === "ok",
  );

  console.log(
    `\n${ok.length}/${results.length} zone host(s) redirect direct visits to policyengine.org.`,
  );
  if (missing.length > 0) {
    console.log(
      `\n${missing.length} zone host(s) still serve direct visits themselves. Each zone adds the redirect in its own repository (repository-guidance.md → The direct-host redirect):`,
    );
    for (const result of missing) {
      console.log(`  - ${result.source} (${new URL(result.destination).host})`);
    }
  }
  if (unlisted.length > 0) {
    console.log(
      "\nThese redirect but aren't in DIRECT_HOST_REDIRECTS yet. Add them so the audit keeps them redirecting:",
    );
    for (const result of unlisted) console.log(`  - "${result.source}",`);
  }

  if (unknown.length > 0) {
    console.error(
      `\nDIRECT_HOST_REDIRECTS lists source(s) with no zone route on a Vercel host: ${unknown.join(", ")}`,
    );
  }
  if (iframed.length > 0) {
    console.error(
      "\nThese articles iframe a host that redirects, so the iframe loads policyengine.org instead of the tool. Point the iframe at the policyengine.org route or remove the redirect:",
    );
    for (const { file, host } of iframed) console.error(`  - ${file}: ${host}`);
  }
  if (failures.length > 0) {
    console.error(
      "\nZone hosts whose direct visits don't reach the same page on policyengine.org:",
    );
    for (const result of failures) {
      console.error(`  - ${result.source}: ${result.state}`);
    }
  }

  return failures.length > 0 || iframed.length > 0 || unknown.length > 0
    ? 1
    : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
