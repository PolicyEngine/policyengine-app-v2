import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";

import nextConfig from "../../../next.config";

interface ConfigRoute {
  source: string;
  destination: string;
  has?: unknown;
  missing?: unknown;
}

export interface ResolvedRoute {
  /** Each redirect a browser would follow, as path + query. */
  hops: string[];
  /** The path the website finally handles, after every redirect. */
  pathname: string;
  /** Where a beforeFiles rewrite proxies that path, if one matches. */
  upstream: URL | null;
}

const ORIGIN = "https://www.policyengine.org";
const MAX_HOPS = 10;

function firstMatch(routes: ConfigRoute[], pathname: string) {
  for (const route of routes) {
    if (route.has || route.missing) {
      throw new Error(
        `resolveRoute does not model has/missing conditions (${route.source})`,
      );
    }
    // The options Next's router server uses for custom routes
    // (buildCustomRoute in server/lib/router-utils/filesystem).
    const params = getPathMatch(route.source, {
      strict: true,
      removeUnnamedParams: true,
    })(pathname);
    if (params) return { route, params };
  }
  return null;
}

// Next's parsed query keeps repeated keys as arrays.
function toQuery(searchParams: URLSearchParams) {
  const query: Record<string, string | string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return query;
}

type RouteParams = Parameters<typeof prepareDestination>[0]["params"];

function compile(
  route: ConfigRoute,
  params: RouteParams,
  url: URL,
  appendParamsToQuery: boolean,
): URL {
  const { parsedDestination } = prepareDestination({
    appendParamsToQuery,
    destination: route.destination,
    params,
    query: toQuery(url.searchParams),
  });
  const target = new URL(parsedDestination.pathname, url);
  if (parsedDestination.hostname) {
    target.protocol = parsedDestination.protocol ?? "https:";
    target.host = parsedDestination.hostname;
  }
  for (const [key, value] of Object.entries(parsedDestination.query)) {
    for (const item of [value].flat()) {
      if (item !== undefined) target.searchParams.append(key, String(item));
    }
  }
  return target;
}

/**
 * Resolves a request against the website's next.config.ts the way Next's
 * router server does: redirects first, in order (following each hop like a
 * browser), then beforeFiles rewrites. Matching and destination compilation
 * use Next's own getPathMatch and prepareDestination. Middleware and page
 * routes are not modelled.
 */
export async function resolveRoute(path: string): Promise<ResolvedRoute> {
  if (!nextConfig.redirects || !nextConfig.rewrites) {
    throw new Error("Expected Next config to define redirects and rewrites.");
  }
  const redirects = (await nextConfig.redirects()) as ConfigRoute[];
  const rewrites = await nextConfig.rewrites();
  if (Array.isArray(rewrites)) {
    throw new Error("Expected rewrites to be grouped by phase.");
  }
  const beforeFiles = (rewrites.beforeFiles ?? []) as ConfigRoute[];

  const hops: string[] = [];
  let url = new URL(path, ORIGIN);
  for (let i = 0; i < MAX_HOPS; i += 1) {
    const hit = firstMatch(redirects, url.pathname);
    if (!hit) break;
    const next = compile(hit.route, hit.params, url, false);
    hops.push(`${next.pathname}${next.search}`);
    if (next.origin !== ORIGIN) {
      return { hops, pathname: next.pathname, upstream: next };
    }
    url = next;
  }

  const rewrite = firstMatch(beforeFiles, url.pathname);
  return {
    hops,
    pathname: url.pathname,
    upstream: rewrite
      ? compile(rewrite.route, rewrite.params, url, true)
      : null,
  };
}
