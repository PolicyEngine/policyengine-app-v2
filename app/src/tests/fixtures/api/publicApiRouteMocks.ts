import { PUBLIC_API_ROUTE_PREFIX } from '@/libs/publicApiRoute/allowList';

/** The page the tests' requests are resolved against, as a browser resolves a path. */
const TEST_PAGE_URL = typeof location === 'undefined' ? 'http://localhost/' : location.href;

/** A fetch request's URL, with a same-origin path made absolute. */
export function requestUrlOf(input: RequestInfo | URL): URL {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new URL(url, TEST_PAGE_URL);
}

/**
 * The Public API path a request names. The calculator sends Public API
 * requests to its own route, `/api/policyengine/{Public API path}`; a test
 * client given its own base URL sends them to that URL's paths.
 */
export function publicApiPathOf(input: RequestInfo | URL): string {
  const { pathname } = requestUrlOf(input);
  return pathname.startsWith(`${PUBLIC_API_ROUTE_PREFIX}/`)
    ? pathname.slice(PUBLIC_API_ROUTE_PREFIX.length)
    : pathname;
}
