/**
 * The Public API operations that app.policyengine.org's own route,
 * `/api/policyengine/{Public API path}`, forwards. The route keeps the
 * Public API's paths, since the calculator generates its types from the
 * Public API's schema; it forwards only the operations below, the ones the
 * calculator calls, and answers 404 for anything else.
 *
 * Each operation is a set of methods and a pattern over the whole path.
 * Path segments are letters, digits, "-" and "_" only, so an encoded slash,
 * a dot segment or a query can never widen a match.
 *
 * Free of imports, so both the route (in calculator-app) and its tests (in
 * app) can load it.
 */

export const PUBLIC_API_ROUTE_PREFIX = '/api/policyengine';

export type ForwardedMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** How long browsers and Vercel's CDN may keep an answer. */
export type CachePolicy = 'never' | 'catalog' | 'metadata';

export interface AllowedOperation {
  /** A short name, for logs and tests. */
  readonly name: string;
  readonly methods: readonly ForwardedMethod[];
  readonly pathPattern: RegExp;
  readonly cache: CachePolicy;
  /** How long to wait for the Public API's response headers. */
  readonly responseHeadersTimeoutMilliseconds: number;
}

export const CACHE_CONTROL: Readonly<Record<CachePolicy, string | undefined>> = {
  // Undefined: the forwarding package answers "no-store".
  never: undefined,
  // Catalog reads are the same for everyone and small enough for the CDN.
  catalog: 's-maxage=3600, stale-while-revalidate=86400',
  // Country metadata is too large for the CDN; browsers keep it an hour.
  metadata: 'max-age=3600',
};

// Placeholder until the implementation commit.
export const ALLOWED_OPERATIONS: readonly AllowedOperation[] = [];

/** The operation a request names, or null when the route forwards no such request. */
export function matchAllowedOperation(
  method: string,
  publicApiPath: string
): AllowedOperation | null {
  return (
    ALLOWED_OPERATIONS.find(
      (operation) =>
        (operation.methods as readonly string[]).includes(method) &&
        operation.pathPattern.test(publicApiPath)
    ) ?? null
  );
}

/** Every method some operation allows, for CORS preflights. */
export const FORWARDED_METHODS: readonly ForwardedMethod[] = ['GET', 'POST', 'PATCH', 'DELETE'];
