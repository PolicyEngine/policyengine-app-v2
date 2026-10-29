import type { MetadataRoutes } from '@/types/metadata';

/**
 * Which Public API routes the v3 workspace uses.
 *
 * - 'v1': `GET /{country}/metadata` for the whole model at start, saved
 *   reforms as `/v2/user-policies` rows pointing at v1 policies
 *   (`POST /{country}/policy`, `legacy_policy_id`), and households
 *   calculated through v1's household routes.
 * - 'v2': only the small `/v2/model-catalog` at start (with the US SPM
 *   settings it offers); parameters, the parameter tree and search load on
 *   demand from the v2 catalog routes, and every variable of the catalog
 *   version loads once in the background (`/v2/model-catalog/variables`)
 *   for the household builder and breakdown; saved reforms are
 *   `/v2/user-policies` rows pointing at `/v2/policies` (`policy_id`);
 *   households are stored on `/v2/households` and calculated through
 *   `/v2/household-calculations`, and a household report can be saved as
 *   a household report on `/v2/reports`.
 *
 * This constant is the only place v3 chooses. It is not a runtime flag or an
 * environment variable, so every build behaves the same. It stays 'v1' until
 * the switch pull request (plan item 4.01), which changes this line to 'v2'
 * (and the test that pins it). The older report builder, the `(calculator)`
 * route group, stays on v1 regardless.
 */
export type V3ApiRoutes = MetadataRoutes;

export const V3_API_ROUTES: V3ApiRoutes = 'v1';

/** The Next.js route group holding the v3 workspace pages. */
export const V3_WORKSPACE_ROUTE_GROUP = '(workspace)';

/**
 * Where model metadata loads from for a page in this route group (the
 * segment below `[countryId]`): v3 follows `v3Routes` (V3_API_ROUTES unless
 * a test names the routes after the switch); everything else stays on v1.
 */
export function metadataRoutesForRouteGroup(
  routeGroup: string | null,
  v3Routes: V3ApiRoutes = V3_API_ROUTES
): V3ApiRoutes {
  return routeGroup === V3_WORKSPACE_ROUTE_GROUP ? v3Routes : 'v1';
}

/**
 * Pages that only send the browser on into v3, by their segments below
 * `[countryId]`: the country's index (to Build, or to the older report
 * builder when the v3 shell is off, which loads its own metadata), the old
 * Home launcher (to Build), the old Library and bill tracker (to Reforms),
 * and the paused Ask page (to Build). A page that redirects elsewhere, such
 * as `(calculator)/reports/create/[userReportId]` into the older report
 * builder, is not one of them.
 */
const REDIRECT_ONLY_PAGES: readonly (readonly string[])[] = [
  [],
  ['(calculator)', 'home'],
  ['(calculator)', 'library'],
  ['(calculator)', 'tracker'],
  [V3_WORKSPACE_ROUTE_GROUP, 'ask'],
];

/**
 * Where model metadata loads from for a page, by its segments below
 * `[countryId]` (`useSelectedLayoutSegments`). After the switch, a page
 * that only redirects into v3 loads nothing (its destination loads its
 * own), so it does not start v1's large download; before the switch it
 * loads v1 as it always has. Every other page follows its route group.
 */
export function metadataRoutesForPage(
  segments: readonly string[],
  v3Routes: V3ApiRoutes = V3_API_ROUTES
): MetadataRoutes | null {
  const redirectOnly = REDIRECT_ONLY_PAGES.some(
    (page) => page.length === segments.length && page.every((segment, i) => segments[i] === segment)
  );
  if (redirectOnly && v3Routes === 'v2') {
    return null;
  }
  return metadataRoutesForRouteGroup(segments[0] ?? null, v3Routes);
}
