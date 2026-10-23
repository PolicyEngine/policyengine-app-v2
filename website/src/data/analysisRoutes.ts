/**
 * Where each research analysis is served (the comparables gate,
 * comparables.ts).
 *
 * The site serves a dashboard by proxying one of its paths to another
 * deployment (a rewrite in next.config.ts, most of them from
 * appZoneRoutes.ts), and keeps old paths working with redirects. This module
 * reads the evaluated rewrite and redirect objects, so a route written any
 * way next.config.ts accepts is seen:
 *
 * - `pageRewriteProblems` names every proxied page that is neither a research
 *   entry's nor on the grandfather list (`routes`, live before the gate) or
 *   the infrastructure list (`infrastructure`, proxies that publish no
 *   analysis, such as the API docs);
 * - `buildAnalysisRoutes` maps every public path and deployment host that
 *   leads to a research app, which PolicyEngine/newsletters reads
 *   (analysisRoutes.json) to recognise a link to an analysis however it is
 *   written.
 */

import { COUNTRY_TAGS, routeEntryKey } from "./comparables";

export const ROUTES_SCHEMA = "analysis-routes/1";

export interface Route {
  source: string;
  destination: string;
}

export interface PathRoute {
  /** A path on policyengine.org, lowercased, with no trailing slash. */
  path: string;
  /** Whether deeper paths under it lead to the same analysis. */
  prefix: boolean;
  /** entryKey() of the research app it leads to. */
  entry: string;
}

export interface HostRoute {
  /** A deployment host, lowercased. */
  host: string;
  /** The path under the host that belongs to the analysis; "/" for all of it. */
  pathPrefix: string;
  /** entryKey()s of the research apps served there (more than one when shared). */
  entries: string[];
}

export interface AnalysisRoutes {
  schema: string;
  paths: PathRoute[];
  hosts: HostRoute[];
}

const COUNTRY_PARAM = ":countryId";
const WILDCARD_SUFFIX = /\/:[A-Za-z]+[*+]?$/;
const ASSET_PREFIXES = ["/_zones/", "/_next/", "/ingest"];

/**
 * The page paths a rewrite or redirect source matches, country parameters
 * expanded and a trailing wildcard (`/:path*`) turned into a prefix. Null for
 * a source this module cannot read, which the gate then refuses.
 */
export function expandSource(
  source: string,
): { paths: string[]; prefix: boolean } | null {
  let path = source.toLowerCase();
  let prefix = false;
  if (WILDCARD_SUFFIX.test(path)) {
    path = path.replace(WILDCARD_SUFFIX, "");
    prefix = true;
  }
  if (path === "") path = "/";
  const countries = path.includes(COUNTRY_PARAM.toLowerCase())
    ? [...COUNTRY_TAGS]
    : [null];
  const paths = countries.map((country) =>
    country ? path.split(COUNTRY_PARAM.toLowerCase()).join(country) : path,
  );
  if (paths.some((p) => p.includes(":") || p.includes("("))) return null;
  return { paths, prefix };
}

/** Whether a source serves files, not a page: zone assets, analytics, a file name. */
export function isAssetSource(source: string): boolean {
  const last = source.split("/").filter(Boolean).pop() ?? "";
  return (
    ASSET_PREFIXES.some((p) => source.startsWith(p)) ||
    (/\.[a-z0-9]+$/i.test(last) && !last.startsWith(":"))
  );
}

function isExternal(destination: string): boolean {
  return /^https?:\/\//i.test(destination);
}

/** Rewrites that proxy a page to another deployment. */
export function pageRewrites(rewrites: Route[]): Route[] {
  return rewrites.filter(
    (r) => isExternal(r.destination) && !isAssetSource(r.source),
  );
}

/**
 * Every reason the proxied pages are not all research entries' or listed:
 * an unreadable source, or a page path that is neither a research app's nor
 * on `routes` or `infrastructure`. A page whose deployment is a research
 * app's (one rewrite serving the tracker under every country, say) is that
 * app's.
 */
export function pageRewriteProblems(
  rewrites: Route[],
  appKeys: Set<string>,
  routes: string[],
  infrastructure: string[],
): string[] {
  const listed = new Set([...routes, ...infrastructure]);
  const appDeployments = new Set<string>();
  for (const rewrite of pageRewrites(rewrites)) {
    const paths = expandSource(rewrite.source)?.paths ?? [];
    if (paths.some((p) => appKeys.has(routeEntryKey(p) ?? ""))) {
      appDeployments.add(deploymentId(rewrite.destination));
    }
  }
  const problems: string[] = [];
  for (const rewrite of pageRewrites(rewrites)) {
    const expanded = expandSource(rewrite.source);
    if (!expanded) {
      problems.push(
        `the rewrite ${rewrite.source} → ${rewrite.destination} proxies a page the comparables gate cannot read; use appZoneRoutes.ts's /<country>/<slug> form`,
      );
      continue;
    }
    if (appDeployments.has(deploymentId(rewrite.destination))) continue;
    for (const path of expanded.paths) {
      if (listed.has(path)) continue;
      problems.push(
        `${path} (rewrite ${rewrite.source} → ${rewrite.destination}) is not a research app's page: add the app to apps.json with its comparables record, or, if it publishes no analysis, to the infrastructure list in comparablesGrandfathered.json`,
      );
    }
  }
  return problems;
}

/** Pages served from a research app's deployment count as the app's. */
function deploymentId(destination: string): string {
  const parts = urlParts(destination);
  return parts ? `${parts.host}${parts.path}` : destination;
}

/** The proxied page paths that are no research app's, for checking the lists. */
export function unlistedPagePaths(
  rewrites: Route[],
  appKeys: Set<string>,
): string[] {
  return [
    ...new Set(
      pageRewriteProblems(rewrites, appKeys, [], []).map(
        (problem) => problem.split(" ")[0],
      ),
    ),
  ].sort();
}

function urlParts(url: string): { host: string; path: string } | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname
      .toLowerCase()
      .replace(WILDCARD_SUFFIX, "")
      .replace(/\/+$/, "");
    return { host: parsed.hostname.toLowerCase(), path: path || "/" };
  } catch {
    return null;
  }
}

/**
 * Every path and host that leads to a research app. Paths: each app's own
 * path, each proxied page whose deployment is an app's, and each redirect
 * that ends at one of those. Hosts: each app's deployment, from its rewrite
 * and its registry source; a host shared by several apps (GitHub Pages, one
 * deployment serving two countries) is narrowed to the path under it.
 */
export function buildAnalysisRoutes(
  rewrites: Route[],
  redirects: Route[],
  apps: Array<{ slug?: string; countryId?: string; source?: string }>,
  appKeys: Set<string>,
): AnalysisRoutes {
  const paths = new Map<string, PathRoute>();
  const add = (path: string, prefix: boolean, entry: string) => {
    const existing = paths.get(path);
    if (!existing || (prefix && !existing.prefix)) {
      paths.set(path, { path, prefix, entry });
    }
  };
  for (const key of appKeys) {
    const [, cs] = key.split(" ");
    add(`/${cs}`, true, key);
  }

  // deployments: where each app's pages are proxied to, and its registry source
  const deployments: Array<{ host: string; path: string; entry: string }> = [];
  const byDestination = new Map<string, string>();
  for (const rewrite of pageRewrites(rewrites)) {
    const expanded = expandSource(rewrite.source);
    const parts = urlParts(rewrite.destination);
    if (!expanded || !parts) continue;
    for (const path of expanded.paths) {
      const key = routeEntryKey(path);
      if (key && appKeys.has(key)) {
        deployments.push({ ...parts, entry: key });
        byDestination.set(`${parts.host}${parts.path}`, key);
      }
    }
  }
  for (const app of apps) {
    const key = `app ${app.countryId}/${app.slug}`;
    if (!appKeys.has(key) || !app.source) continue;
    const parts = urlParts(app.source);
    if (parts) deployments.push({ ...parts, entry: key });
  }
  // a proxied page that is not an app's own path but serves an app's deployment
  for (const rewrite of pageRewrites(rewrites)) {
    const expanded = expandSource(rewrite.source);
    const parts = urlParts(rewrite.destination);
    if (!expanded || !parts) continue;
    const entry = byDestination.get(`${parts.host}${parts.path}`);
    if (!entry) continue;
    // a zone route serves its deeper pages too, with or without a /:path* twin
    for (const path of expanded.paths) add(path, true, entry);
  }
  // redirects that end at an analysis
  const resolve = (path: string): PathRoute | undefined => {
    const exact = paths.get(path);
    if (exact) return exact;
    for (const route of paths.values()) {
      if (route.prefix && path.startsWith(`${route.path}/`)) return route;
    }
    return undefined;
  };
  for (let pass = 0; pass < 3; pass += 1) {
    for (const redirect of redirects) {
      if (isExternal(redirect.destination)) continue;
      const from = expandSource(redirect.source);
      const to = expandSource(redirect.destination);
      if (!from || !to) continue;
      from.paths.forEach((path, i) => {
        const target = resolve(to.paths[Math.min(i, to.paths.length - 1)]);
        if (!target || target.path === path) return;
        // a redirect runs before any page, so it decides where the path leads
        const existing = paths.get(path);
        const prefix =
          from.prefix ||
          (existing?.entry === target.entry && existing.prefix) ||
          false;
        paths.set(path, { path, prefix, entry: target.entry });
      });
    }
  }

  // hosts: a host one app owns is all its; a shared one is narrowed by path
  const owners = new Map<string, Set<string>>();
  for (const d of deployments) {
    if (!owners.has(d.host)) owners.set(d.host, new Set());
    owners.get(d.host)!.add(d.entry);
  }
  const hosts = new Map<string, HostRoute>();
  for (const d of deployments) {
    const shared = (owners.get(d.host)?.size ?? 0) > 1;
    // a GitHub Pages host serves one project per first path segment
    const project = d.path.split("/").filter(Boolean)[0];
    const pathPrefix = d.host.endsWith(".github.io")
      ? project
        ? `/${project}`
        : "/"
      : shared
        ? d.path
        : "/";
    const id = `${d.host}${pathPrefix}`;
    const route = hosts.get(id) ?? { host: d.host, pathPrefix, entries: [] };
    if (!route.entries.includes(d.entry)) route.entries.push(d.entry);
    route.entries.sort();
    hosts.set(id, route);
  }

  return {
    schema: ROUTES_SCHEMA,
    paths: [...paths.values()].sort((a, b) => a.path.localeCompare(b.path)),
    hosts: [...hosts.values()].sort((a, b) =>
      `${a.host}${a.pathPrefix}`.localeCompare(`${b.host}${b.pathPrefix}`),
    ),
  };
}
