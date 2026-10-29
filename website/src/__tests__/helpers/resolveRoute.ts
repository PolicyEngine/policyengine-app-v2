import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import {
  matchHas,
  prepareDestination,
} from "next/dist/shared/lib/router/utils/prepare-destination";

import nextConfig from "../../../next.config";

type RouteHas = NonNullable<Parameters<typeof matchHas>[2]>;

interface ConfigRoute {
  source: string;
  destination: string;
  has?: RouteHas;
  missing?: RouteHas;
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

// A plain browser request: no cookies or extra headers.
const REQUEST = { headers: { host: "www.policyengine.org" } } as Parameters<
  typeof matchHas
>[0];

function firstMatch(routes: ConfigRoute[], url: URL) {
  for (const route of routes) {
    // The options Next's router server uses for custom routes
    // (buildCustomRoute in server/lib/router-utils/filesystem), except case:
    // `next dev` matches sources case-insensitively, but on Vercel
    // /us/Methodology and /uk/CliffWatch 404, so match as deployed.
    const params = getPathMatch(route.source, {
      strict: true,
      removeUnnamedParams: true,
      sensitive: true,
    })(url.pathname);
    if (!params) continue;
    if (route.has || route.missing) {
      const hasParams = matchHas(
        REQUEST,
        toQuery(url.searchParams),
        route.has,
        route.missing,
      );
      if (!hasParams) continue;
      Object.assign(params, hasParams);
    }
    return { route, params };
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

// With trailingSlash off, Next puts this redirect ahead of the config's own
// (loadCustomRoutes in next/dist/lib/load-custom-routes).
const STRIP_TRAILING_SLASH: ConfigRoute = {
  source: "/:path+/",
  destination: "/:path+",
};

/**
 * Resolves a request against the website's next.config.ts: Next's
 * trailing-slash redirect, then the config's redirects in order (following
 * each hop like a browser), then beforeFiles rewrites. Matching, has/missing
 * conditions (for a plain request) and destination compilation use Next's own
 * getPathMatch, matchHas and prepareDestination. Not modelled: the /_next
 * guard on redirects, middleware, filesystem routes, and afterFiles and
 * fallback rewrites.
 */
export async function resolveRoute(path: string): Promise<ResolvedRoute> {
  if (!nextConfig.redirects || !nextConfig.rewrites) {
    throw new Error("Expected Next config to define redirects and rewrites.");
  }
  if (nextConfig.trailingSlash) {
    throw new Error("resolveRoute assumes trailingSlash is off.");
  }
  const redirects = [
    STRIP_TRAILING_SLASH,
    ...((await nextConfig.redirects()) as ConfigRoute[]),
  ];
  const rewrites = await nextConfig.rewrites();
  if (Array.isArray(rewrites)) {
    throw new Error("Expected rewrites to be grouped by phase.");
  }
  const beforeFiles = (rewrites.beforeFiles ?? []) as ConfigRoute[];

  const hops: string[] = [];
  let url = new URL(path, ORIGIN);
  for (let i = 0; i < MAX_HOPS; i += 1) {
    const hit = firstMatch(redirects, url);
    if (!hit) break;
    const next = compile(hit.route, hit.params, url, false);
    hops.push(`${next.pathname}${next.search}`);
    if (next.origin !== ORIGIN) {
      return { hops, pathname: next.pathname, upstream: next };
    }
    url = next;
  }

  const rewrite = firstMatch(beforeFiles, url);
  return {
    hops,
    pathname: url.pathname,
    upstream: rewrite
      ? compile(rewrite.route, rewrite.params, url, true)
      : null,
  };
}
