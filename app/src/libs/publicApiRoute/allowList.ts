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
 * Imports only the route's prefix, so both the route (in calculator-app)
 * and its tests (in app) can load it.
 */

export { PUBLIC_API_ROUTE_PREFIX } from './sameOriginRoute';

export type ForwardedMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** How long browsers and Vercel's CDN may keep an answer. */
export type CachePolicy = 'never' | 'catalog' | 'metadata';

export interface AllowedOperation {
  /** A short name, for logs and tests. */
  readonly name: string;
  readonly methods: readonly ForwardedMethod[];
  readonly pathPattern: RegExp;
  readonly cache: CachePolicy;
}

export const CACHE_CONTROL: Readonly<Record<CachePolicy, string | undefined>> = {
  // Undefined: the forwarding package answers "no-store".
  never: undefined,
  // Catalog reads are the same for everyone and small enough for the CDN.
  catalog: 's-maxage=3600, stale-while-revalidate=86400',
  // Country metadata is too large for the CDN; browsers keep it an hour.
  metadata: 'max-age=3600',
};

const COUNTRY = '(?:us|uk)';
/** The v1 routes' integer IDs. */
const NUMERIC_ID = '[0-9]{1,10}';
/** Saved-record and shared-report IDs. */
const UUID = '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}';
/** v2 policy IDs, which the schema types only as strings. */
const OPAQUE_ID = '[A-Za-z0-9_-]{1,64}';

/**
 * How long the route waits for the Public API's response headers, for every
 * operation: as long as the route's function may run (`maxDuration`, 800 s,
 * Vercel Pro's standard limit on Fluid compute), less 50 s for a token
 * request and the body. The Public API has no shorter limit to match: its
 * Cloud Run services end a request 300 s after an instance takes it (read
 * 2026-11-10), but a request can first wait for an instance to start. Its
 * load balancer recorded answers after up to 396 s, and slow answers are
 * not only calculations: country metadata took up to 246 s and a v1 policy
 * read 242 s (2026-11-03 to 2026-11-10). Browsers calling it directly
 * waited as long as their own timers allowed (none for most calls, 240 s
 * for a household under a policy, 10 minutes for calculate-full), so a
 * shorter wait here would turn answers into errors.
 */
export const PUBLIC_API_WAIT_MILLISECONDS = 750_000;

function exactPath(pattern: string): RegExp {
  return new RegExp(`^${pattern}$`);
}

function operation(
  name: string,
  methods: readonly ForwardedMethod[],
  pathPattern: string,
  cache: CachePolicy = 'never'
): AllowedOperation {
  return { name, methods, pathPattern: exactPath(pathPattern), cache };
}

/**
 * Every Public API operation the calculator sends (app/src/api/), checked
 * against the code on 2026-11-09. Add an operation here when the
 * calculator starts calling a new one.
 */
export const ALLOWED_OPERATIONS: readonly AllowedOperation[] = [
  // Country metadata (api/metadata.ts).
  operation('metadata', ['GET'], `/${COUNTRY}/metadata`, 'metadata'),

  // Households and their calculations (api/household.ts,
  // householdCalculation.ts, householdVariation.ts).
  operation('household creation', ['POST'], `/${COUNTRY}/household`),
  operation('household', ['GET'], `/${COUNTRY}/household/${NUMERIC_ID}`),
  operation(
    'household under a policy',
    ['GET'],
    `/${COUNTRY}/household/${NUMERIC_ID}/policy/${NUMERIC_ID}`
  ),
  operation('household calculation with variations', ['POST'], `/${COUNTRY}/calculate-full`),

  // v1 policies, simulations and reports (api/policy.ts, simulation.ts,
  // report.ts). Updates send the ID in the body.
  operation('policy creation', ['POST'], `/${COUNTRY}/policy`),
  operation('policy', ['GET'], `/${COUNTRY}/policy/${NUMERIC_ID}`),
  operation('simulation creation and update', ['POST', 'PATCH'], `/${COUNTRY}/simulation`),
  operation('simulation', ['GET'], `/${COUNTRY}/simulation/${NUMERIC_ID}`),
  operation('report creation and update', ['POST', 'PATCH'], `/${COUNTRY}/report`),
  operation('report', ['GET'], `/${COUNTRY}/report/${NUMERIC_ID}`),

  // Economy comparisons, polled; DELETE clears a stored failure before a
  // retry (api/societyWideCalculation.ts, budgetWindow.ts).
  operation(
    'economy comparison',
    ['GET', 'DELETE'],
    `/${COUNTRY}/economy/${NUMERIC_ID}/over/${NUMERIC_ID}`
  ),
  operation(
    'budget-window economy comparison',
    ['GET'],
    `/${COUNTRY}/economy/${NUMERIC_ID}/over/${NUMERIC_ID}/budget-window`
  ),

  // The v2 model catalog (api/publicApi/).
  operation('model catalog', ['GET'], '/v2/model-catalog', 'catalog'),
  operation('catalog parameters', ['GET'], '/v2/model-catalog/parameters', 'catalog'),
  operation('catalog variables', ['GET'], '/v2/model-catalog/variables', 'catalog'),
  operation('parameter children', ['GET'], '/v2/parameters/children', 'catalog'),
  operation('parameter search file', ['GET'], '/v2/parameters/search-file', 'catalog'),

  // v2 policies (api/reformStore.ts).
  operation('v2 policy creation', ['POST'], '/v2/policies'),
  operation('v2 policy', ['GET'], `/v2/policies/${OPAQUE_ID}`),

  // The signed-in account (api/v2Me.ts).
  operation('account', ['GET', 'DELETE'], '/v2/me'),
  operation('account export', ['GET'], '/v2/me/export'),
  operation('account upgrade', ['POST'], '/v2/me/upgrade'),

  // Shared reports, read by anyone with the link (api/sharedReport.ts).
  operation('shared report', ['GET'], `/v2/shared-reports/${UUID}`),

  // Saved records (api/v2Associations.ts).
  operation('saved policies', ['GET', 'POST'], '/v2/user-policies'),
  operation('saved policy', ['GET', 'PATCH', 'DELETE'], `/v2/user-policies/${UUID}`),
  operation('saved reports', ['GET', 'POST'], '/v2/user-reports'),
  operation('saved report', ['GET', 'PATCH'], `/v2/user-reports/${UUID}`),
  operation('saved households', ['GET', 'POST'], '/v2/user-households'),
];

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
