#!/usr/bin/env node
/**
 * Audits what a reader gets when they visit a zone's production Vercel host
 * directly instead of its policyengine.org route.
 *
 * policyengine.org proxies each route in appZoneRoutes.ts to a `*.vercel.app`
 * host, so that host serves the same page outside the site. A zone redirects
 * direct visits back to policyengine.org (docs/engineering/skills/
 * repository-guidance.md → The direct-host redirect). This audit requests each
 * zone's host the way a reader with an old link would, at the route's root
 * and at a path under it, and checks that:
 *
 * - every source in DIRECT_HOST_REDIRECTS still redirects, at both paths;
 * - every redirect, listed or not, is permanent and names an https
 *   policyengine.org URL that the website's rewrites (its icon rewrites, then
 *   appZoneRewrites, in order) proxy back to the URL asked for, path and
 *   query alike;
 * - a same-host redirect on the way that changes more than a trailing slash
 *   is one a reader of the public URL gets too: they land on the same page;
 * - policyengine.org serves that URL itself, without redirecting it to
 *   another page or back to the zone's host, and at the root answers 200;
 * - that page doesn't name a `*.vercel.app` URL as its canonical or og:url.
 *
 * It fails only on evidence: a redirect that goes wrong, or a listed zone
 * that serves a page or a 404 without redirecting. A request that fails, that
 * keeps answering 401, 403, 408, 425, 429 or 5xx after retries, or that
 * Vercel's SSO answers, makes the route unreachable: reported, never failed,
 * as are the zones still unprobed when the run reaches its deadline. Zones
 * with no redirect yet are reported too.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseArgs } from "./audit-app-zone-shell.mjs";

const DEFAULT_ROUTES_FILE = "website/src/data/appZoneRoutes.ts";
const DEFAULT_ICON_REWRITES_FILE =
  "website/src/data/policyEngineIconRewrites.ts";
const DEFAULT_ARTICLES_DIR = "app/src/data/posts/articles";
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_DELAYS_MS = [1000, 4000];
const MAX_HOPS = 5;
// The workflow's job allows 20 minutes. A zone takes at most two probes of
// three 15-second tries each, plus 5 seconds of backoff: 100 seconds.
const DEFAULT_DEADLINE_MS = 12 * 60 * 1000;

export const PUBLIC_ORIGIN = "https://www.policyengine.org";
export const PROBE_PARAM = "pe_direct_host_audit";
export const DEEP_PROBE_SEGMENT = "direct-host-audit";
export const USER_AGENT = "PolicyEngine zone direct-host audit";
const PERMANENT_STATUSES = new Set([301, 308]);

/**
 * Sources whose production host redirects direct visits to policyengine.org.
 * Only add to this list: the audit fails if any of these stops redirecting,
 * so a zone can't silently go back to serving its pages off the site.
 */
export const DIRECT_HOST_REDIRECTS = [];

/**
 * Statuses that say nothing about the redirect: an SSO or bot challenge, a
 * rate limit, a timeout or a server error. The audit retries them, then
 * reports the route as unreachable.
 */
export function isUnreachableStatus(status) {
  return [401, 403, 408, 425, 429].includes(status) || status >= 500;
}

function isRetryable(result) {
  return (
    result.error !== undefined ||
    (result.status !== 401 &&
      result.status !== 403 &&
      isUnreachableStatus(result.status))
  );
}

/** The site's hosts: its own, and the apex domain for a www origin (the apex 307s to www). */
function publicHosts(publicOrigin) {
  const { hostname } = new URL(publicOrigin);
  return new Set([hostname, hostname.replace(/^www\./, "")]);
}

/** Whether `url` is an https URL on the site, on the default port. */
function isPublicUrl(url, publicOrigin) {
  return (
    url.protocol === "https:" &&
    url.port === "" &&
    publicHosts(publicOrigin).has(url.hostname)
  );
}

function trimTrailingPath(path) {
  return path.replace(/\/+$/, "") || "/";
}

/** Whether the rewrite sends requests to a `*.vercel.app` host (some destinations are the website's own files). */
export function isProductionVercelHost(destination) {
  return URL.canParse(destination)
    ? new URL(destination).hostname.endsWith(".vercel.app")
    : false;
}

async function importList(file, name) {
  const list = (await import(pathToFileURL(resolve(file)).href))[name];
  if (!Array.isArray(list)) throw new Error(`${file} doesn't export ${name}`);
  return list;
}

/**
 * The website's rewrites up to and including the zones', in the order
 * `website/next.config.ts` applies them: its icon rewrites, then
 * appZoneRewrites. Pass an empty `iconRewritesFile` to leave the icons out.
 */
export async function loadRewrites(
  routesFile = DEFAULT_ROUTES_FILE,
  iconRewritesFile = DEFAULT_ICON_REWRITES_FILE,
) {
  return [
    ...(iconRewritesFile
      ? await importList(iconRewritesFile, "policyEngineIconRewrites")
      : []),
    ...(await importList(routesFile, "appZoneRewrites")),
  ];
}

/** The zones: rewrites of a plain path (no parameters) to a `*.vercel.app` host. */
export function zoneRoutes(rewrites) {
  return rewrites.filter(
    (rule) =>
      !rule.source.includes(":") && isProductionVercelHost(rule.destination),
  );
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiles a rewrite source the way Next does for the forms appZoneRewrites
 * uses: literal segments, `:name` (one segment) and `:name*` (zero or more),
 * with an optional trailing slash. Matching is case-sensitive: www serves
 * /US/GIVECALC its own 404 (2026-10-29).
 */
export function compileSource(source) {
  const names = [];
  const pattern = source
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const param = segment.match(/^:(\w+)(\*)?$/);
      if (!param) return `\\/${escapeRegExp(segment)}`;
      names.push({ name: param[1], repeated: Boolean(param[2]) });
      return param[2]
        ? "(?:\\/((?:[^\\/#?]+?)(?:\\/(?:[^\\/#?]+?))*))?"
        : "\\/([^\\/#?]+?)";
    })
    .join("");
  const regex = new RegExp(`^${pattern}(?:\\/)?$`);
  return (pathname) => {
    const match = regex.exec(pathname);
    if (!match) return null;
    return Object.fromEntries(
      names.map(({ name }, index) => [name, match[index + 1] ?? ""]),
    );
  };
}

function fillParams(template, params, { path }) {
  return template.replace(/(\/?):(\w+)(\*)?/g, (whole, slash, name, star) => {
    if (!(name in params)) return whole;
    const value = params[name];
    if (star && path) return value ? `${slash}${value}` : "";
    return `${slash}${value}`;
  });
}

/** A query's key-value pairs, encoded so that no two different pairs collide. */
function queryPairs(searchParams) {
  return Array.from(
    searchParams,
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
  ).sort();
}

function samePairs(left, right) {
  return (
    left.length === right.length &&
    left.every((pair, index) => pair === right[index])
  );
}

/**
 * The zone URL policyengine.org fetches for `publicUrl`: the first rewrite
 * whose source matches its path, with the path parameters filled in. As in
 * Next, a query key the destination sets replaces the visitor's values for it,
 * and every other key passes through. Null when no zone rewrite matches.
 */
export function proxiedUrl(rewrites, publicUrl) {
  const visitor = new URL(publicUrl);
  for (const rule of rewrites) {
    const params = compileSource(rule.source)(visitor.pathname);
    if (!params) continue;
    const [base, query = ""] = rule.destination.split("?");
    // A relative destination is one of the website's own files.
    const target = new URL(fillParams(base, params, { path: true }), visitor);
    const destinationQuery = new URLSearchParams(
      fillParams(query, params, { path: false }),
    );
    for (const [key, value] of visitor.searchParams) {
      if (!destinationQuery.has(key)) target.searchParams.append(key, value);
    }
    for (const [key, value] of destinationQuery) {
      target.searchParams.append(key, value);
    }
    return { url: target.toString(), rule };
  }
  return null;
}

/** Whether two URLs differ in nothing but a trailing slash. */
function sameUrlButSlash(a, b) {
  const left = new URL(a);
  const right = new URL(b);
  return (
    left.host === right.host &&
    trimTrailingPath(left.pathname) === trimTrailingPath(right.pathname) &&
    samePairs(queryPairs(left.searchParams), queryPairs(right.searchParams))
  );
}

/**
 * The two URLs a reader could hold on a zone's host: its root, which must
 * serve a page, and a path under it, which no zone serves. The second checks
 * that the redirect keeps the path; its target answers whatever the zone
 * answers for an unknown page, typically 404.
 *
 * Given the rewrites, each probe also names `publicUrl`, the policyengine.org
 * URL that proxies to it, when the rewrites have one: the zone's source for
 * the root, and the deep rewrite's path under it for the second (for /us/pe84,
 * whose root rewrite goes to /us/pe84/calculator, that's /us/pe84/<page>).
 */
export function probeUrls(zone, rewrites, publicOrigin = PUBLIC_ORIGIN) {
  const root = new URL(zone.destination);
  root.searchParams.append(PROBE_PARAM, "1");
  const deep = new URL(root);
  deep.pathname = `${trimTrailingPath(root.pathname).replace(/\/$/, "")}/${DEEP_PROBE_SEGMENT}`;
  const probes = [
    { url: root.toString(), requirePage: true },
    { url: deep.toString(), requirePage: false },
  ];
  if (!rewrites) return probes;

  const publicFor = (path) => {
    const url = new URL(path, publicOrigin);
    url.searchParams.append(PROBE_PARAM, "1");
    const proxied = proxiedUrl(rewrites, url);
    return proxied && new URL(proxied.url).host === root.host
      ? { publicUrl: url.toString(), url: proxied.url }
      : null;
  };
  const publicRoot = publicFor(zone.source);
  if (publicRoot && sameUrlButSlash(publicRoot.url, probes[0].url)) {
    probes[0].publicUrl = publicRoot.publicUrl;
  }
  const publicDeep = publicFor(`${zone.source}/${DEEP_PROBE_SEGMENT}`);
  if (publicDeep) Object.assign(probes[1], publicDeep);
  return probes;
}

/** Whether `path` is `base` or a path under it. */
function isUnder(path, base) {
  const trimmed = trimTrailingPath(base);
  return (
    trimmed === "/" ||
    trimTrailingPath(path) === trimmed ||
    path.startsWith(`${trimmed}/`)
  );
}

/**
 * A zone on the same host whose rewrite adds query pairs that `fromUrl`
 * carries and the matched rewrite doesn't: the route that serves the page
 * under its own name, such as /uk/marriage for `/us/marriage?country=uk`.
 */
function moreSpecificZone(zones, fromUrl, rule) {
  const from = new URL(fromUrl);
  const fromPairs = new Set(queryPairs(from.searchParams));
  const matchedPairs = queryPairs(
    new URLSearchParams(rule.destination.split("?")[1] ?? ""),
  );
  return zones.find((zone) => {
    const destination = new URL(zone.destination);
    const pairs = queryPairs(destination.searchParams);
    return (
      destination.host === from.host &&
      pairs.length > matchedPairs.length &&
      pairs.every((pair) => fromPairs.has(pair)) &&
      isUnder(from.pathname, destination.pathname)
    );
  });
}

/**
 * Whether a redirect from `fromUrl` to `location` keeps the reader on the
 * same page: an https policyengine.org URL that the zone rewrites proxy back
 * to `fromUrl`, path and query alike.
 */
export function redirectKeepsPage(
  rewrites,
  fromUrl,
  location,
  publicOrigin = PUBLIC_ORIGIN,
) {
  const from = new URL(fromUrl);
  const target = new URL(location, from);
  if (!isPublicUrl(target, publicOrigin)) {
    return { ok: false, reason: `redirects off ${publicOrigin} to ${target}` };
  }

  const proxied = proxiedUrl(rewrites, target);
  if (!proxied) {
    return {
      ok: false,
      reason: `policyengine.org doesn't proxy ${target.pathname} to a zone`,
    };
  }
  const back = new URL(proxied.url);
  if (
    back.host !== from.host ||
    trimTrailingPath(back.pathname) !== trimTrailingPath(from.pathname) ||
    !samePairs(queryPairs(back.searchParams), queryPairs(from.searchParams))
  ) {
    return { ok: false, reason: `${target} serves ${back}, not ${from}` };
  }

  const better = moreSpecificZone(zoneRoutes(rewrites), from, proxied.rule);
  return { ok: true, ...(better ? { betterSource: better.source } : {}) };
}

/** Whether two URLs name the same page on the site: path (trailing slash aside) and query. */
function samePublicPage(a, b, publicOrigin) {
  const left = new URL(a);
  const right = new URL(b);
  return (
    isPublicUrl(left, publicOrigin) &&
    isPublicUrl(right, publicOrigin) &&
    trimTrailingPath(left.pathname) === trimTrailingPath(right.pathname) &&
    samePairs(queryPairs(left.searchParams), queryPairs(right.searchParams))
  );
}

const NAMED_ENTITIES = {
  amp: "&",
  apos: "'",
  colon: ":",
  gt: ">",
  lt: "<",
  nbsp: "\u00a0",
  period: ".",
  quot: '"',
  sol: "/",
};

/** Decodes the character references an attribute value can hold. */
function decodeEntities(text) {
  return text.replace(
    /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));?/g,
    (whole, decimal, hex, name) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      return NAMED_ENTITIES[name.toLowerCase()] ?? whole;
    },
  );
}

/** A tag's attributes, lower-cased names to decoded values; the first of a repeated name wins, as in HTML. */
function attributes(tag) {
  const found = {};
  const body = tag.replace(/^<[a-zA-Z]+/, "").replace(/\/?>$/, "");
  for (const match of body.matchAll(
    /([^\s=<>"'\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'=<`]+)))?/g,
  )) {
    const name = match[1].toLowerCase();
    if (!(name in found)) {
      found[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
    }
  }
  return found;
}

// A tag whose quoted attribute values may hold a ">".
const tagPattern = (name) =>
  new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi");

/**
 * The URLs a page names as itself, its canonical links and og:url, resolved
 * against the page's URL and its <base>. Markup that isn't parsed as tags,
 * such as comments and script, style, template, title or textarea contents,
 * is skipped.
 */
export function canonicalUrls(html, pageUrl = PUBLIC_ORIGIN) {
  const active = html
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(
      /<(script|style|template|title|textarea)\b[\s\S]*?(?:<\/\1\s*>|$)/gi,
      "",
    );
  const resolveUrl = (href, base) => {
    try {
      return new URL(href.trim(), base).toString();
    } catch {
      return null;
    }
  };
  let base = pageUrl;
  for (const [tag] of active.matchAll(tagPattern("base"))) {
    const { href } = attributes(tag);
    if (href !== undefined) {
      base = resolveUrl(href, pageUrl) ?? pageUrl;
      break;
    }
  }
  const urls = [];
  for (const [tag] of active.matchAll(tagPattern("link"))) {
    const attrs = attributes(tag);
    if (
      attrs.href &&
      attrs.rel?.toLowerCase().split(/\s+/).includes("canonical")
    ) {
      urls.push({ kind: "canonical", url: resolveUrl(attrs.href, base) });
    }
  }
  for (const [tag] of active.matchAll(tagPattern("meta"))) {
    const attrs = attributes(tag);
    if (attrs.content && attrs.property?.toLowerCase() === "og:url") {
      urls.push({ kind: "og:url", url: resolveUrl(attrs.content, base) });
    }
  }
  return urls.filter(({ url }) => url);
}

async function request(fetchImpl, url, options) {
  const { timeout, retryDelays, sleep, readBody } = options;
  for (let attempt = 0; ; attempt += 1) {
    let result;
    try {
      const response = await fetchImpl(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeout),
        headers: { "user-agent": USER_AGENT },
      });
      result = {
        status: response.status,
        location: response.headers.get("location"),
      };
      if (readBody && response.status === 200 && response.text) {
        result.body = await response.text();
      }
    } catch (error) {
      result = { error: error?.message ?? String(error) };
    }
    if (!isRetryable(result) || attempt >= retryDelays.length) return result;
    await sleep(retryDelays[attempt]);
  }
}

/**
 * Follows `url` hop by hop. `stop(url)` ends the walk early (for example on
 * leaving the starting host); a revisited URL or more than MAX_HOPS is a loop.
 */
async function walk(fetchImpl, url, options, stop = () => false) {
  const visited = [];
  let current = url;
  for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
    if (visited.includes(current)) return { loop: true, visited };
    visited.push(current);
    const response = await request(fetchImpl, current, options);
    if (response.error !== undefined) {
      return { error: response.error, url: current, visited };
    }
    const { status, location, body } = response;
    if (status < 300 || status >= 400 || !location) {
      return { status, url: current, body, visited };
    }
    const next = new URL(location, current).toString();
    if (stop(next)) return { status, url: current, location: next, visited };
    current = next;
  }
  return { loop: true, visited };
}

/**
 * Probes one URL on a zone's host: the direct visit (following same-host hops
 * such as a trailing-slash redirect) and, when it redirects, the URL it names.
 * With `requirePage`, that URL must answer 200.
 */
export async function probeDirectHost(
  rewrites,
  directUrl,
  {
    fetchImpl = fetch,
    timeout = DEFAULT_TIMEOUT_MS,
    publicOrigin = PUBLIC_ORIGIN,
    requirePage = true,
    publicUrl,
    retryDelays = DEFAULT_RETRY_DELAYS_MS,
    sleep = delay,
  } = {},
) {
  const options = { timeout, retryDelays, sleep, readBody: false };
  const host = new URL(directUrl).host;
  const result = (state, fields) => ({ state, directUrl, ...fields });

  const direct = await walk(
    fetchImpl,
    directUrl,
    options,
    (next) => new URL(next).host !== host,
  );
  if (direct.loop) {
    return result("wrong", {
      reason: `loops on its own host: ${direct.visited.join(" -> ")}`,
    });
  }
  if (direct.error !== undefined) {
    return result("unreachable", {
      reason: `${direct.url}: request failed: ${direct.error}`,
    });
  }
  if (!direct.location) {
    return isUnreachableStatus(direct.status) ||
      (direct.status >= 300 && direct.status < 400)
      ? result("unreachable", {
          reason: `${direct.url} answers ${direct.status}`,
        })
      : result("missing", { status: direct.status });
  }

  const target = new URL(direct.location);
  if (!PERMANENT_STATUSES.has(direct.status)) {
    // Vercel's SSO answers a protected host with a temporary redirect to
    // vercel.com. Any other temporary redirect is the zone's own.
    return /(^|\.)vercel\.com$/.test(target.hostname)
      ? result("unreachable", {
          reason: `answers ${direct.status} to ${target.host}`,
        })
      : result("wrong", {
          reason: `answers ${direct.status} to ${target}, not a permanent (308) redirect to policyengine.org`,
        });
  }

  // Compared with the last URL on the zone's host, since a reader who comes
  // through policyengine.org takes the same trailing-slash hop. A same-host
  // redirect that changes more than that may be one only direct visits get,
  // so the public URL has to land on the same page.
  const kept = redirectKeepsPage(
    rewrites,
    direct.url,
    direct.location,
    publicOrigin,
  );
  if (!kept.ok) return result("wrong", { reason: kept.reason });
  if (!sameUrlButSlash(directUrl, direct.url)) {
    if (!publicUrl) {
      const strict = redirectKeepsPage(
        rewrites,
        directUrl,
        direct.location,
        publicOrigin,
      );
      if (!strict.ok) {
        return result("wrong", {
          reason: `redirects on its own host to ${direct.url} first, then ${strict.reason}`,
        });
      }
    } else {
      const reader = await walk(
        fetchImpl,
        publicUrl,
        options,
        (next) => !isPublicUrl(new URL(next), publicOrigin),
      );
      if (reader.loop) {
        return result("wrong", {
          reason: `loops: ${reader.visited.join(" -> ")}`,
        });
      }
      if (reader.error !== undefined) {
        return result("unreachable", {
          reason: `${reader.url}: request failed: ${reader.error}`,
        });
      }
      const readerLands = reader.location ?? reader.url;
      if (!samePublicPage(readerLands, direct.location, publicOrigin)) {
        return result("wrong", {
          reason: `redirects on its own host to ${direct.url}, then to ${direct.location}, but a reader of ${publicUrl} lands on ${readerLands}`,
        });
      }
    }
  }

  const landed = await walk(fetchImpl, direct.location, {
    ...options,
    readBody: requirePage,
  });
  if (landed.loop) {
    return result("wrong", { reason: `loops: ${landed.visited.join(" -> ")}` });
  }
  if (landed.error !== undefined) {
    return result("unreachable", {
      reason: `${landed.url}: request failed: ${landed.error}`,
    });
  }
  if (new URL(landed.url).host === host) {
    return result("wrong", {
      reason: `${direct.location} sends readers back to ${host}`,
    });
  }
  if (!samePublicPage(landed.url, direct.location, publicOrigin)) {
    return result("wrong", {
      reason: `policyengine.org sends ${direct.location} on to ${landed.url}`,
    });
  }
  if (isUnreachableStatus(landed.status)) {
    return result("unreachable", {
      reason: `${landed.url} answers ${landed.status}`,
    });
  }
  if (requirePage && landed.status !== 200) {
    return result("wrong", {
      reason: `${direct.location} answers ${landed.status}`,
    });
  }
  for (const { kind, url } of canonicalUrls(landed.body ?? "", landed.url)) {
    if (new URL(url).hostname.endsWith(".vercel.app")) {
      return result("wrong", {
        reason: `${landed.url} names ${url} as its ${kind}; use the policyengine.org URL`,
      });
    }
  }

  return result("ok", {
    location: direct.location,
    sameHostHops: direct.visited.length - 1,
    // Hops policyengine.org adds on top: the apex's 307 to www, a trailing slash.
    publicHops: landed.visited.slice(1),
    ...(kept.betterSource ? { betterSource: kept.betterSource } : {}),
  });
}

/** The zone hosts each article's iframes load, keyed by article file. */
export function findIframedHosts(textByFile, hosts) {
  const found = [];
  const iframeSrc = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  for (const [file, text] of Object.entries(textByFile)) {
    for (const match of text.matchAll(iframeSrc)) {
      if (!URL.canParse(match[1])) continue;
      const { hostname } = new URL(match[1]);
      if (hosts.has(hostname)) found.push({ file, host: hostname });
    }
  }
  return found;
}

/**
 * Folds a route's probe results (root first, then a page under it) into one
 * verdict. A redirect that lands anywhere but the same page fails, listed or
 * not; a listed route fails once either path stops redirecting. An unlisted
 * host that redirects only some paths ("partial") is reported, not failed:
 * readers on the others still get the page, as before.
 */
export function summarizeRoute(route, probes, listed) {
  const count = (state) => probes.filter((probe) => probe.state === state);
  let state;
  if (count("wrong").length > 0) state = "wrong";
  else if (count("unreachable").length > 0) state = "unreachable";
  else if (count("ok").length === probes.length) state = "ok";
  else if (count("ok").length === 0) state = "missing";
  else state = "partial";

  const fails = state === "wrong" || (listed && count("missing").length > 0);
  return { ...route, state, listed, fails, probes };
}

/** Each article's text: markdown as is, and a notebook's cells joined. */
function readArticles(dir) {
  const textByFile = {};
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (name.endsWith(".md")) {
      textByFile[file] = readFileSync(file, "utf8");
    } else if (name.endsWith(".ipynb")) {
      const notebook = JSON.parse(readFileSync(file, "utf8"));
      textByFile[file] = (notebook.cells ?? [])
        .flatMap((cell) => [
          ...[cell.source].flat(),
          ...(cell.outputs ?? []).flatMap((output) =>
            Object.values(output.data ?? {}).flat(),
          ),
        ])
        .filter((part) => typeof part === "string")
        .join("");
    }
  }
  return textByFile;
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
  {
    fetchImpl = fetch,
    directHostRedirects = DIRECT_HOST_REDIRECTS,
    retryDelays = DEFAULT_RETRY_DELAYS_MS,
    sleep = delay,
    now = Date.now,
  } = {},
) {
  const args = parseArgs(argv);
  const routesFile = args["routes-file"] ?? DEFAULT_ROUTES_FILE;
  const iconRewritesFile =
    args["icon-rewrites-file"] ?? DEFAULT_ICON_REWRITES_FILE;
  const articlesDir = args["articles-dir"] ?? DEFAULT_ARTICLES_DIR;
  const concurrency = Number(args.concurrency ?? DEFAULT_CONCURRENCY);
  const timeout = Number(args.timeout ?? DEFAULT_TIMEOUT_MS);
  // Zones still unprobed at the deadline are reported as unreachable, so a
  // wide outage ends the run inconclusive before the job's own time limit.
  const deadline = now() + Number(args["deadline-ms"] ?? DEFAULT_DEADLINE_MS);
  // Lets a test deployment that mirrors policyengine.org stand in for it.
  const publicOrigin = args["public-origin"] ?? PUBLIC_ORIGIN;

  const rewrites = await loadRewrites(
    routesFile,
    iconRewritesFile === "none" ? "" : iconRewritesFile,
  );
  const zones = zoneRoutes(rewrites);
  const unknown = directHostRedirects.filter(
    (source) => !zones.some((zone) => zone.source === source),
  );

  console.log(
    `Probing the production Vercel hosts of ${zones.length} app-zone route(s) directly.\n`,
  );

  const results = await runWithConcurrency(zones, concurrency, async (zone) => {
    const probes = [];
    for (const { url, requirePage, publicUrl } of probeUrls(
      zone,
      rewrites,
      publicOrigin,
    )) {
      probes.push(
        now() > deadline
          ? {
              state: "unreachable",
              directUrl: url,
              reason: "not probed: the audit reached its deadline",
            }
          : await probeDirectHost(rewrites, url, {
              fetchImpl,
              timeout,
              publicOrigin,
              requirePage,
              publicUrl,
              retryDelays,
              sleep,
            }),
      );
    }
    return summarizeRoute(
      zone,
      probes,
      directHostRedirects.includes(zone.source),
    );
  });

  const marks = {
    ok: "OK",
    partial: "PARTIAL",
    missing: "MISSING",
    unreachable: "UNREACHABLE",
  };
  for (const result of results) {
    const mark = result.fails ? "FAIL" : marks[result.state];
    console.log(
      `${mark} ${result.source} (${new URL(result.destination).host})`,
    );
    for (const probe of result.probes) {
      if (probe.state === "wrong" || probe.state === "unreachable") {
        console.log(`    ${probe.directUrl}: ${probe.reason}`);
      } else if (probe.state === "missing" && result.state !== "missing") {
        console.log(
          `    ${probe.directUrl}: answers ${probe.status}, no redirect`,
        );
      } else if (probe.state === "ok") {
        if (probe.publicHops.length > 0) {
          console.log(
            `    ${probe.directUrl}: costs readers ${probe.publicHops.length} more hop(s) on policyengine.org, to ${probe.publicHops.join(" -> ")}. Redirect straight there.`,
          );
        }
        if (probe.betterSource) {
          console.log(
            `    ${probe.directUrl}: lands on ${probe.location}, though ${probe.betterSource} serves this page under its own name`,
          );
        }
      }
    }
    if (result.listed && result.probes.some((p) => p.state === "missing")) {
      console.log(
        "    listed in DIRECT_HOST_REDIRECTS but no longer redirects",
      );
    }
  }

  const iframed = findIframedHosts(
    readArticles(articlesDir),
    new Set(zones.map((zone) => new URL(zone.destination).hostname)),
  );

  const ok = results.filter((result) => result.state === "ok");
  const missing = results.filter((result) => result.state === "missing");
  const unreachable = results.filter(
    (result) => result.state === "unreachable",
  );
  const failures = results.filter((result) => result.fails);
  const unlisted = results.filter(
    (result) =>
      !result.listed &&
      !result.fails &&
      result.probes.every((probe) => probe.state === "ok"),
  );

  console.log(
    `\n${ok.length}/${results.length} zone host(s) redirect direct visits to policyengine.org.`,
  );
  if (missing.length > 0) {
    console.log(
      `\n${missing.length} zone host(s) still serve direct visits themselves. Each zone adds the redirect in its own repository (repository-guidance.md → The direct-host redirect):`,
    );
    for (const result of missing) {
      const statuses = result.probes.map((probe) => probe.status).join(", ");
      console.log(
        `  - ${result.source} (${new URL(result.destination).host}): ${statuses}`,
      );
    }
  }
  if (unreachable.length > 0) {
    console.log(
      `\nThe audit couldn't check ${unreachable.length} zone host(s) after retries; each line above says why:`,
    );
    for (const result of unreachable) console.log(`  - ${result.source}`);
  }
  if (unlisted.length > 0) {
    console.log(
      "\nThese redirect but aren't in DIRECT_HOST_REDIRECTS yet. Add them so the audit keeps them redirecting:",
    );
    for (const result of unlisted) console.log(`  - "${result.source}",`);
  }
  if (iframed.length > 0) {
    console.log(
      "\nThese articles iframe a zone's Vercel host. Point each iframe at the zone's policyengine.org route, which serves the same page:",
    );
    for (const { file, host } of iframed) console.log(`  - ${file}: ${host}`);
  }

  if (unknown.length > 0) {
    console.error(
      `\nDIRECT_HOST_REDIRECTS lists source(s) with no zone route on a Vercel host: ${unknown.join(", ")}`,
    );
  }
  if (failures.length > 0) {
    console.error(
      "\nZone hosts whose direct visits don't reach the same page on policyengine.org:",
    );
    for (const result of failures) {
      console.error(`  - ${result.source}: ${result.state}`);
    }
  }

  return failures.length > 0 || unknown.length > 0 ? 1 : 0;
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
