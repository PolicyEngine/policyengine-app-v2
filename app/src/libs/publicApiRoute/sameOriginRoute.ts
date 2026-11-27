/**
 * What the browser needs to know about app.policyengine.org's own route to
 * the Public API (calculator-app/src/app/api/policyengine/[...path]/route.ts).
 *
 * Free of imports, so the route, the allow list, `BASE_URL` and tests can
 * all load it.
 */

/** Where the route is served: `/api/policyengine/{Public API path}`, on the page's origin. */
export const PUBLIC_API_ROUTE_PREFIX = '/api/policyengine';

/**
 * Set to "true" on an answer the route wrote itself, such as "the Public API
 * could not be reached", never on the Public API's own answers. The same
 * name as the forwarding package's ROUTE_ERROR_HEADER, which the browser
 * bundle must not import.
 */
export const ROUTE_ERROR_HEADER = 'X-PolicyEngine-Route-Error';
