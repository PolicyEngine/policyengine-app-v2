/**
 * Where app.policyengine.org's own route to the Public API is served:
 * `/api/policyengine/{Public API path}`, on the page's origin
 * (calculator-app/src/app/api/policyengine/[...path]/route.ts).
 *
 * Free of imports, so the route, the allow list, `BASE_URL` and tests can
 * all load it.
 */
export const PUBLIC_API_ROUTE_PREFIX = '/api/policyengine';
