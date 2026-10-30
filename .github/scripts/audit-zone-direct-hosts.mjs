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
 * - that page doesn't name a `*.vercel.app` URL as its canonical or og:url,
 *   decoded and parsed as a browser does.
 *
 * Every hop on the way stays on policyengine.org, and every Location is a
 * URL.
 *
 * It fails only on evidence: a redirect that goes wrong, or a listed zone
 * that serves a page or a 404 without redirecting. A request that fails, that
 * keeps answering 401, 403, 408, 425, 429 or 5xx after retries, or that
 * Vercel's SSO answers (on the zone's host or on the way through
 * policyengine.org), makes the route unreachable: reported, never failed.
 * So does the run's deadline: no request, retry or parse outlasts it, and a
 * page the audit can't parse in time is reported the same way. Zones with no
 * redirect yet are reported too.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MIMEType } from "node:util";
import {
  isMainThread,
  parentPort,
  Worker,
  workerData,
} from "node:worker_threads";

import { parse } from "parse5";

import { parseArgs } from "./audit-app-zone-shell.mjs";

const DEFAULT_ROUTES_FILE = "website/src/data/appZoneRoutes.ts";
const DEFAULT_ICON_REWRITES_FILE =
  "website/src/data/policyEngineIconRewrites.ts";
const DEFAULT_ARTICLES_DIR = "app/src/data/posts/articles";
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_DELAYS_MS = [1000, 4000];
const MAX_HOPS = 5;
// The workflow's job allows 20 minutes. No request or retry runs past this
// deadline (each request's timeout is cut to the time left), so the probes
// end by it, and what's left is reported unreachable.
const DEFAULT_DEADLINE_MS = 12 * 60 * 1000;
const DEADLINE_ERROR = "the audit reached its deadline";
// A page's canonical links are read in a worker that gets this long (or what
// the deadline leaves) and this much heap. A typical page parses in
// milliseconds; parse5 takes about 6 s at 50,000 nested elements.
const DEFAULT_PARSE_TIMEOUT_MS = 10_000;
const PARSE_MEMORY_MB = 512;
const CANONICAL_WORKER = "zoneDirectHostAuditCanonicalUrls";
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
// The Encoding Standard's labels for its replacement encoding, which
// TextDecoder won't construct. TextDecoder resolves every other label itself
// in a Node built with full ICU, as the official builds are.
const REPLACEMENT_LABELS = new Set([
  "csiso2022kr",
  "hz-gb-2312",
  "iso-2022-cn",
  "iso-2022-cn-ext",
  "iso-2022-kr",
  "replacement",
]);
// How much of a page the prescan reads, as the HTML standard suggests.
const PRESCAN_BYTES = 1024;
const OUT_OF_BYTES = Symbol("the prescan ran out of bytes");

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
 * Given the rewrites, the deep probe is the zone URL that the route's own
 * path under its source proxies to, when that's on the zone's host (for
 * /us/pe84, whose root rewrite goes to /us/pe84/calculator, that's
 * /us/pe84/<page>). Each probe also names `publicUrl`, a policyengine.org URL
 * that proxies to it, when the rewrites have one: preferably the route's own
 * path, otherwise the first rewrite that serves the probe (publicUrlFor),
 * such as the 2025 year in review's /2025-year-in-review/... asset route.
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
  const publicDeep = publicFor(`${zone.source}/${DEEP_PROBE_SEGMENT}`);
  if (publicDeep) probes[1].url = publicDeep.url;
  const own = [publicFor(zone.source), publicDeep];
  probes.forEach((probe, index) => {
    const publicUrl =
      own[index] && sameUrlButSlash(own[index].url, probe.url)
        ? own[index].publicUrl
        : publicUrlFor(rewrites, probe.url, publicOrigin);
    if (publicUrl) probe.publicUrl = publicUrl;
  });
  return probes;
}

/**
 * A policyengine.org URL that the rewrites proxy to `zoneUrl`, found by
 * running each rewrite backwards: match the zone URL's path against the
 * rewrite's destination, fill its source with the same parameters, and keep
 * the result only if the rewrites, run forwards in order, proxy it back to
 * `zoneUrl`. The query rides along. Null when no rewrite serves it.
 */
export function publicUrlFor(rewrites, zoneUrl, publicOrigin = PUBLIC_ORIGIN) {
  const zone = new URL(zoneUrl);
  for (const rule of rewrites) {
    if (!URL.canParse(rule.destination)) continue;
    const destination = new URL(rule.destination);
    if (destination.host !== zone.host) continue;
    const params = compileSource(destination.pathname)(zone.pathname);
    if (!params) continue;
    const candidate = new URL(
      fillParams(rule.source, params, { path: true }) || "/",
      publicOrigin,
    );
    candidate.search = zone.search;
    const proxied = proxiedUrl(rewrites, candidate);
    if (proxied && sameUrlButSlash(proxied.url, zoneUrl)) {
      return candidate.toString();
    }
  }
  return null;
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

/**
 * Whether two policyengine.org URLs serve the same zone page: the rewrites
 * proxy both to one zone URL (trailing slash aside), such as a route and an
 * asset path that reach the same page.
 */
function sameZonePage(rewrites, a, b, publicOrigin) {
  if (!isPublicUrl(new URL(a), publicOrigin)) return false;
  if (!isPublicUrl(new URL(b), publicOrigin)) return false;
  const left = proxiedUrl(rewrites, a);
  const right = proxiedUrl(rewrites, b);
  return Boolean(left && right && sameUrlButSlash(left.url, right.url));
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

const asciiLower = (text) =>
  text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
const isAsciiSpace = (char) =>
  char === "\t" ||
  char === "\n" ||
  char === "\f" ||
  char === "\r" ||
  char === " ";
const isSpaceByte = (byte) =>
  byte === 0x09 ||
  byte === 0x0a ||
  byte === 0x0c ||
  byte === 0x0d ||
  byte === 0x20;
const isLetterByte = (byte) => (byte | 0x20) >= 0x61 && (byte | 0x20) <= 0x7a;
const lowerByte = (byte) =>
  String.fromCharCode(byte >= 0x41 && byte <= 0x5a ? byte + 0x20 : byte);
const attribute = (element, name) =>
  element.attrs.find((attr) => attr.name === name)?.value;

/**
 * The Encoding Standard's "get an encoding": the name of the encoding a label
 * names, or null. Every label is ASCII letters, digits and `-._:`.
 */
export function encodingFor(label) {
  const name = asciiLower(label.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, ""));
  if (!/^[a-z0-9._:-]+$/.test(name)) return null;
  if (REPLACEMENT_LABELS.has(name)) return "replacement";
  try {
    return new TextDecoder(name).encoding;
  } catch {
    return null;
  }
}

/**
 * Bytes in a known encoding as text. The replacement encoding reads as one
 * U+FFFD.
 */
function decodeAs(bytes, encoding) {
  if (encoding === "replacement") return bytes.length > 0 ? "\uFFFD" : "";
  return new TextDecoder(encoding).decode(bytes);
}

/**
 * Fetch's "get, decode, and split": a header's values, split on commas
 * outside quoted strings.
 */
function splitHeader(input) {
  const values = [];
  let value = "";
  let position = 0;
  for (;;) {
    while (
      position < input.length &&
      input[position] !== '"' &&
      input[position] !== ","
    ) {
      value += input[position];
      position += 1;
    }
    if (input[position] === '"') {
      // An HTTP quoted string, kept as written: a backslash escapes the next
      // character.
      const start = position;
      position += 1;
      while (position < input.length) {
        const char = input[position];
        position += char === "\\" ? 2 : 1;
        if (char === '"') break;
      }
      value += input.slice(start, position);
      if (position < input.length) continue;
    }
    values.push(value.replace(/^[\t ]+|[\t ]+$/g, ""));
    value = "";
    if (position >= input.length) return values;
    position += 1;
  }
}

/**
 * The encoding a Content-Type header names, as Fetch reads it ("extract a
 * MIME type", then "legacy extract an encoding"), or null. node:util's
 * MIMEType parses each value as the MIME Sniffing standard does, quoted
 * strings and backslash escapes included.
 */
export function transportEncoding(contentType) {
  if (contentType === null || contentType === undefined) return null;
  let essence = null;
  let carried = null;
  let charset = null;
  for (const value of splitHeader(contentType)) {
    let type;
    try {
      type = new MIMEType(value);
    } catch {
      continue;
    }
    if (type.essence === "*/*") continue;
    const own = type.params.get("charset");
    if (type.essence !== essence) {
      // A new MIME type drops the charset of the one before.
      essence = type.essence;
      carried = own;
      charset = own;
    } else {
      charset = own ?? carried;
    }
  }
  return charset === null ? null : encodingFor(charset);
}

/**
 * The HTML standard's "extracting a character encoding from a meta element",
 * for a content attribute such as `text/html; charset=koi8-r`: an encoding's
 * name, or null.
 */
export function extractMetaEncoding(content) {
  const lower = asciiLower(content);
  for (let position = 0; ; ) {
    let index = lower.indexOf("charset", position);
    if (index === -1) return null;
    index += "charset".length;
    while (isAsciiSpace(content[index])) index += 1;
    if (content[index] !== "=") {
      position = index;
      continue;
    }
    index += 1;
    while (isAsciiSpace(content[index])) index += 1;
    const next = content[index];
    if (next === undefined) return null;
    if (next === '"' || next === "'") {
      const close = content.indexOf(next, index + 1);
      return close === -1 ? null : encodingFor(content.slice(index + 1, close));
    }
    let end = index;
    while (
      end < content.length &&
      !isAsciiSpace(content[end]) &&
      content[end] !== ";"
    ) {
      end += 1;
    }
    return encodingFor(content.slice(index, end));
  }
}

/**
 * The HTML standard's "get an XML encoding", for a prescan that runs out of
 * bytes.
 */
function xmlEncoding(input) {
  const bytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (!bytes.subarray(0, 5).equals(Buffer.from("<?xml"))) return null;
  const end = bytes.indexOf(0x3e);
  if (end === -1) return null;
  let position = bytes.subarray(0, end).indexOf("encoding");
  if (position === -1) return null;
  position += "encoding".length;
  while (bytes[position] <= 0x20) position += 1;
  if (bytes[position] !== 0x3d) return null;
  position += 1;
  while (bytes[position] <= 0x20) position += 1;
  const quote = bytes[position];
  if (quote !== 0x22 && quote !== 0x27) return null;
  position += 1;
  const close = bytes.indexOf(quote, position);
  if (close === -1) return null;
  const label = bytes.subarray(position, close);
  if (label.some((byte) => byte <= 0x20)) return null;
  const encoding = encodingFor(label.toString("latin1"));
  return encoding === "utf-16be" || encoding === "utf-16le"
    ? "utf-8"
    : encoding;
}

/**
 * The HTML standard's prescan of a page's first 1024 bytes for an encoding
 * declaration: a `<meta charset>`, a `<meta http-equiv=content-type>` with a
 * content charset, or an XML declaration. It skips comments and reads past
 * other tags' attributes. An encoding's name, or null.
 */
export function prescanEncoding(bytes) {
  const input = bytes.subarray(0, PRESCAN_BYTES);
  try {
    return prescan(input);
  } catch (error) {
    if (error !== OUT_OF_BYTES) throw error;
    return xmlEncoding(input);
  }
}

function prescan(input) {
  let position = 0;
  // Running out of bytes anywhere ends the prescan (prescanEncoding).
  const at = (index) => {
    if (index >= input.length) throw OUT_OF_BYTES;
    return input[index];
  };
  const startsWith = (...bytes) =>
    bytes.every((byte, offset) => input[position + offset] === byte);
  const getAttribute = () => {
    while (isSpaceByte(at(position)) || at(position) === 0x2f) position += 1;
    if (at(position) === 0x3e) return null;
    let name = "";
    let value = "";
    for (;;) {
      const byte = at(position);
      if (byte === 0x3d && name !== "") break;
      if (isSpaceByte(byte)) {
        while (isSpaceByte(at(position))) position += 1;
        if (at(position) !== 0x3d) return { name, value };
        break;
      }
      if (byte === 0x2f || byte === 0x3e) return { name, value };
      name += lowerByte(byte);
      position += 1;
    }
    position += 1;
    while (isSpaceByte(at(position))) position += 1;
    const quote = at(position);
    if (quote === 0x22 || quote === 0x27) {
      for (position += 1; at(position) !== quote; position += 1) {
        value += lowerByte(at(position));
      }
      position += 1;
      return { name, value };
    }
    if (quote === 0x3e) return { name, value };
    for (; !isSpaceByte(at(position)) && at(position) !== 0x3e; position += 1) {
      value += lowerByte(at(position));
    }
    return { name, value };
  };

  if (startsWith(0x3c, 0x00, 0x3f, 0x00, 0x78, 0x00)) return "utf-16le";
  if (startsWith(0x00, 0x3c, 0x00, 0x3f, 0x00, 0x78)) return "utf-16be";
  for (; ; position += 1) {
    const byte = at(position);
    const next = input[position + 1];
    if (startsWith(0x3c, 0x21, 0x2d, 0x2d)) {
      // To the first ">" after two dashes, which can be the comment's own.
      position += 4;
      while (
        at(position) !== 0x3e ||
        input[position - 1] !== 0x2d ||
        input[position - 2] !== 0x2d
      ) {
        position += 1;
      }
    } else if (
      byte === 0x3c &&
      asciiLower(
        String.fromCharCode(...input.subarray(position + 1, position + 5)),
      ) === "meta" &&
      (isSpaceByte(input[position + 5]) || input[position + 5] === 0x2f)
    ) {
      position += 5;
      const names = new Set();
      let gotPragma = false;
      let needPragma = null;
      // undefined: none yet; null: a label that names no encoding.
      let charset;
      for (let attr = getAttribute(); attr; attr = getAttribute()) {
        if (names.has(attr.name)) continue;
        names.add(attr.name);
        if (attr.name === "http-equiv") {
          if (attr.value === "content-type") gotPragma = true;
        } else if (attr.name === "content") {
          const encoding = extractMetaEncoding(attr.value);
          if (encoding !== null && charset === undefined) {
            charset = encoding;
            needPragma = true;
          }
        } else if (attr.name === "charset") {
          charset = encodingFor(attr.value);
          needPragma = false;
        }
      }
      if (
        needPragma !== null &&
        (gotPragma || !needPragma) &&
        charset !== null
      ) {
        if (charset === "utf-16be" || charset === "utf-16le") return "utf-8";
        if (charset === "x-user-defined") return "windows-1252";
        return charset;
      }
    } else if (
      byte === 0x3c &&
      (isLetterByte(next) ||
        (next === 0x2f && isLetterByte(input[position + 2])))
    ) {
      while (!isSpaceByte(at(position)) && at(position) !== 0x3e) position += 1;
      while (getAttribute());
    } else if (
      byte === 0x3c &&
      (next === 0x21 || next === 0x2f || next === 0x3f)
    ) {
      position += 1;
      while (at(position) !== 0x3e) position += 1;
    }
  }
}

/**
 * The HTML standard's encoding sniffing, as a browser with an English locale
 * runs it: a byte-order mark, then the Content-Type charset (both certain),
 * then the prescan, then windows-1252 (both tentative: a `<meta>` the parser
 * meets can change them).
 */
export function sniffEncoding(bytes, contentType) {
  const bom =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
      ? "utf-8"
      : bytes[0] === 0xfe && bytes[1] === 0xff
        ? "utf-16be"
        : bytes[0] === 0xff && bytes[1] === 0xfe
          ? "utf-16le"
          : null;
  if (bom !== null) return { encoding: bom, certain: true };
  const transport = transportEncoding(contentType);
  if (transport !== null) return { encoding: transport, certain: true };
  return {
    encoding: prescanEncoding(bytes) ?? "windows-1252",
    certain: false,
  };
}

/**
 * A parsed document's HTML elements in tree order; with `templates`, template
 * contents too.
 */
function htmlElements(document, { templates = false } = {}) {
  const elements = [];
  // Without recursion: a deep page can't overflow the stack.
  const stack = [document];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.namespaceURI === HTML_NAMESPACE) elements.push(node);
    const children =
      templates && node.content ? node.content.childNodes : node.childNodes;
    for (let i = (children?.length ?? 0) - 1; i >= 0; i -= 1) {
      stack.push(children[i]);
    }
  }
  return elements;
}

/**
 * The encoding the first `<meta>` the parser meets declares, read as the HTML
 * standard's "change the encoding" reads it (UTF-16 as UTF-8, x-user-defined
 * as windows-1252), or null. The parser meets elements in source order,
 * template contents included; `<noscript>` holds text.
 */
function declaredEncoding(document) {
  const metas = htmlElements(document, { templates: true })
    .filter(({ tagName }) => tagName === "meta")
    .sort(
      (a, b) =>
        a.sourceCodeLocation.startOffset - b.sourceCodeLocation.startOffset,
    );
  for (const meta of metas) {
    const charset = attribute(meta, "charset");
    let encoding = charset === undefined ? null : encodingFor(charset);
    const content = attribute(meta, "content");
    if (
      encoding === null &&
      content !== undefined &&
      asciiLower(attribute(meta, "http-equiv") ?? "") === "content-type"
    ) {
      encoding = extractMetaEncoding(content);
    }
    if (encoding === "utf-16be" || encoding === "utf-16le") return "utf-8";
    if (encoding === "x-user-defined") return "windows-1252";
    if (encoding !== null) return encoding;
  }
  return null;
}

/**
 * The URLs a parsed page names as itself, its canonical links and og:url.
 * Only HTML `<link>` and `<meta>` elements count, not SVG or MathML ones, and
 * not what template contents, comments, scripts or attribute values hold.
 * URLs resolve against the page's URL and its first `<base href>`. Values
 * that aren't URLs are skipped.
 */
function canonicalUrlsIn(document, pageUrl) {
  const elements = htmlElements(document);
  const resolveUrl = (value, base) => {
    try {
      return new URL(value, base).toString();
    } catch {
      return null;
    }
  };
  const baseHref = elements
    .filter(({ tagName }) => tagName === "base")
    .map((element) => attribute(element, "href"))
    .find((href) => href !== undefined);
  // The HTML standard's frozen base URL: a base that doesn't parse, or is a
  // data: or javascript: URL, leaves the page's URL. (Parsing has already
  // lowercased the scheme.)
  const baseUrl = baseHref === undefined ? null : resolveUrl(baseHref, pageUrl);
  const base =
    baseUrl && !/^(data|javascript):/.test(baseUrl) ? baseUrl : pageUrl;
  const tokens = (value) => value.toLowerCase().split(/[\t\n\f\r ]+/);
  const urls = [];
  for (const element of elements) {
    if (element.tagName === "link") {
      const rel = attribute(element, "rel");
      const href = attribute(element, "href");
      if (rel !== undefined && href !== undefined) {
        if (tokens(rel).includes("canonical")) {
          urls.push({ kind: "canonical", url: resolveUrl(href, base) });
        }
      }
    } else if (element.tagName === "meta") {
      const property = attribute(element, "property");
      const content = attribute(element, "content");
      if (property !== undefined && content !== undefined) {
        if (property.trim().toLowerCase() === "og:url") {
          urls.push({ kind: "og:url", url: resolveUrl(content, base) });
        }
      }
    }
  }
  return urls.filter(({ url }) => url);
}

/**
 * The URLs a page's markup names as itself (canonicalUrlsIn), read as a
 * browser reads them: parse5 (the parser jsdom wraps) builds the tree with
 * scripting on, as in a browser, so `<noscript>` holds text, not elements.
 * Character references are decoded. Parsing runs no script and loads
 * nothing; deep nesting makes it slow, so the audit runs it in a worker it
 * can stop (readCanonicalUrls).
 */
export function canonicalUrls(html, pageUrl = PUBLIC_ORIGIN) {
  return canonicalUrlsIn(parse(html, { scriptingEnabled: true }), pageUrl);
}

/**
 * canonicalUrls for a page's bytes, decoded as a browser decodes them
 * (sniffEncoding). When the encoding is tentative and the first `<meta>` the
 * parser meets declares another, the page is decoded again in that one and
 * parsed again, as a browser does.
 */
export function pageCanonicalUrls(bytes, contentType, pageUrl = PUBLIC_ORIGIN) {
  const { encoding, certain } = sniffEncoding(bytes, contentType);
  let document = parse(decodeAs(bytes, encoding), {
    scriptingEnabled: true,
    sourceCodeLocationInfo: !certain,
  });
  // A page read as UTF-16 keeps it whatever a <meta> says.
  if (!certain && encoding !== "utf-16be" && encoding !== "utf-16le") {
    const declared = declaredEncoding(document);
    if (declared !== null && declared !== encoding) {
      document = parse(decodeAs(bytes, declared), { scriptingEnabled: true });
    }
  }
  return canonicalUrlsIn(document, pageUrl);
}

/**
 * pageCanonicalUrls in a worker thread, stopped after `timeout` ms. Resolves
 * `{ urls }`, or `{ error }` when decoding or parsing runs out of time or
 * memory or throws, so a page the audit can't read is reported, never
 * passed, and can't stop the run.
 */
export function readCanonicalUrls(
  bytes,
  contentType,
  pageUrl,
  { timeout = DEFAULT_PARSE_TIMEOUT_MS } = {},
) {
  return new Promise((done) => {
    let settled = false;
    let worker;
    try {
      worker = new Worker(new URL(import.meta.url), {
        workerData: { [CANONICAL_WORKER]: { bytes, contentType, pageUrl } },
        execArgv: [],
        resourceLimits: { maxOldGenerationSizeMb: PARSE_MEMORY_MB },
      });
    } catch (error) {
      done({ error: error?.message ?? String(error) });
      return;
    }
    // Answers once the worker has stopped, so at most one per probe runs.
    const settle = (answer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate().finally(() => done(answer));
    };
    const timer = setTimeout(
      () => settle({ error: `parsing took over ${timeout} ms` }),
      timeout,
    );
    worker.once("message", (urls) => settle({ urls }));
    worker.once("error", (error) =>
      settle({ error: error?.message ?? String(error) }),
    );
    worker.once("exit", (code) =>
      settle({ error: `the parser exited with code ${code}` }),
    );
  });
}

async function request(fetchImpl, url, options) {
  const { timeout, retryDelays, sleep, readBody, deadline, now } = options;
  for (let attempt = 0; ; attempt += 1) {
    const left = deadline - now();
    if (left <= 0) return { error: DEADLINE_ERROR };
    let result;
    try {
      const response = await fetchImpl(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(Math.min(timeout, left)),
        headers: { "user-agent": USER_AGENT },
      });
      result = {
        status: response.status,
        location: response.headers.get("location"),
      };
      if (readBody && response.status === 200) {
        result.body = new Uint8Array(await response.arrayBuffer());
        result.contentType = response.headers.get("content-type");
      }
    } catch (error) {
      result = { error: error?.message ?? String(error) };
    }
    if (!isRetryable(result) || attempt >= retryDelays.length) return result;
    // A retry that would start after the deadline doesn't; the last answer
    // already reads as unreachable.
    if (now() + retryDelays[attempt] >= deadline) return result;
    await sleep(retryDelays[attempt]);
  }
}

/**
 * Follows `url` hop by hop. `stop(url)` ends the walk early (for example on
 * leaving the starting host); a revisited URL or more than MAX_HOPS is a loop.
 * A Location that isn't a URL ends it too: a browser shows a network error.
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
    const { status, location, body, contentType } = response;
    if (status < 300 || status >= 400 || !location) {
      return { status, url: current, body, contentType, visited };
    }
    let next;
    try {
      next = new URL(location, current).toString();
    } catch {
      return { status, url: current, badLocation: location, visited };
    }
    if (stop(next)) return { status, url: current, location: next, visited };
    current = next;
  }
  return { loop: true, visited };
}

/**
 * Vercel's SSO answers a protected host with a temporary redirect to
 * vercel.com, which says nothing about where a reader lands.
 */
function isVercelLogin(status, location) {
  return (
    !PERMANENT_STATUSES.has(status) &&
    /(^|\.)vercel\.com$/.test(new URL(location).hostname)
  );
}

/**
 * A walk's failure that isn't about where it lands (a loop, an error, a
 * Location that isn't a URL), as the state and fields of a result, or null.
 */
function walkFailure(walked, describeLoop) {
  if (walked.loop) {
    return ["wrong", { reason: describeLoop(walked.visited) }];
  }
  if (walked.error !== undefined) {
    return [
      "unreachable",
      { reason: `${walked.url}: request failed: ${walked.error}` },
    ];
  }
  if (walked.badLocation !== undefined) {
    return [
      "wrong",
      {
        reason: `${walked.url} answers ${walked.status} with a Location that isn't a URL: ${walked.badLocation}`,
      },
    ];
  }
  return null;
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
    deadline = Infinity,
    now = Date.now,
    parseTimeout = DEFAULT_PARSE_TIMEOUT_MS,
  } = {},
) {
  const options = {
    timeout,
    retryDelays,
    sleep,
    readBody: false,
    deadline,
    now,
  };
  const host = new URL(directUrl).host;
  const result = (state, fields) => ({ state, directUrl, ...fields });

  const direct = await walk(
    fetchImpl,
    directUrl,
    options,
    (next) => new URL(next).host !== host,
  );
  const directFailure = walkFailure(
    direct,
    (visited) => `loops on its own host: ${visited.join(" -> ")}`,
  );
  if (directFailure) return result(...directFailure);
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
    // Any temporary redirect but Vercel's SSO is the zone's own.
    return isVercelLogin(direct.status, direct.location)
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
      const readerFailure = walkFailure(
        reader,
        (visited) => `loops: ${visited.join(" -> ")}`,
      );
      if (readerFailure) return result(...readerFailure);
      // A challenge, an error or an SSO login says nothing about where the
      // reader lands.
      if (!reader.location && isUnreachableStatus(reader.status)) {
        return result("unreachable", {
          reason: `${reader.url} answers ${reader.status}`,
        });
      }
      if (reader.location && isVercelLogin(reader.status, reader.location)) {
        return result("unreachable", {
          reason: `${reader.url} answers ${reader.status} to ${new URL(reader.location).host}`,
        });
      }
      const readerLands = reader.location ?? reader.url;
      if (
        !samePublicPage(readerLands, direct.location, publicOrigin) &&
        !sameZonePage(rewrites, readerLands, direct.location, publicOrigin)
      ) {
        return result("wrong", {
          reason: `redirects on its own host to ${direct.url}, then to ${direct.location}, but a reader of ${publicUrl} lands on ${readerLands}`,
        });
      }
    }
  }

  // Each hop must stay on policyengine.org: the walk stops before following
  // one that leaves it, even one that would come back.
  const landed = await walk(
    fetchImpl,
    direct.location,
    { ...options, readBody: requirePage },
    (next) => !isPublicUrl(new URL(next), publicOrigin),
  );
  const landedFailure = walkFailure(
    landed,
    (visited) => `loops: ${visited.join(" -> ")}`,
  );
  if (landedFailure) return result(...landedFailure);
  // The walk stops before an SSO login too (a test mirror behind Vercel's
  // SSO, given as --public-origin), without following it.
  if (
    landed.location !== undefined &&
    isVercelLogin(landed.status, landed.location)
  ) {
    return result("unreachable", {
      reason: `${landed.url} answers ${landed.status} to ${new URL(landed.location).host}`,
    });
  }
  if (landed.location !== undefined) {
    return result("wrong", {
      reason:
        new URL(landed.location).host === host
          ? `${landed.url} sends readers back to ${host}`
          : `policyengine.org sends ${landed.url} off the site, to ${landed.location}`,
    });
  }
  // Another public URL for the same zone page is only an extra hop.
  if (
    !samePublicPage(landed.url, direct.location, publicOrigin) &&
    !sameZonePage(rewrites, landed.url, direct.location, publicOrigin)
  ) {
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
  let named = [];
  if (landed.body) {
    const left = Math.min(parseTimeout, deadline - now());
    if (left <= 0) {
      return result("unreachable", {
        reason: `${landed.url}: ${DEADLINE_ERROR}`,
      });
    }
    const read = await readCanonicalUrls(
      landed.body,
      landed.contentType,
      landed.url,
      { timeout: left },
    );
    if (read.error !== undefined) {
      return result("unreachable", {
        reason: `couldn't read the canonical links of ${landed.url}: ${read.error}`,
      });
    }
    named = read.urls;
  }
  for (const { kind, url } of named) {
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
    parseTimeout = DEFAULT_PARSE_TIMEOUT_MS,
  } = {},
) {
  const args = parseArgs(argv);
  const routesFile = args["routes-file"] ?? DEFAULT_ROUTES_FILE;
  const iconRewritesFile =
    args["icon-rewrites-file"] ?? DEFAULT_ICON_REWRITES_FILE;
  const articlesDir = args["articles-dir"] ?? DEFAULT_ARTICLES_DIR;
  const concurrency = Number(args.concurrency ?? DEFAULT_CONCURRENCY);
  const timeout = Number(args.timeout ?? DEFAULT_TIMEOUT_MS);
  // Requests stop at the deadline and the probes left are reported as
  // unreachable, so a wide outage ends the run inconclusive before the job's
  // own time limit.
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
              deadline,
              now,
              parseTimeout,
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

if (!isMainThread && workerData?.[CANONICAL_WORKER]) {
  const { bytes, contentType, pageUrl } = workerData[CANONICAL_WORKER];
  parentPort.postMessage(pageCanonicalUrls(bytes, contentType, pageUrl));
} else if (isMainThread && process.argv[1] === fileURLToPath(import.meta.url)) {
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
