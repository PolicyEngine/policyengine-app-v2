import type { MetadataRoutes } from '@/types/metadata';

/**
 * Which Public API routes the v3 workspace uses.
 *
 * - 'v1': `GET /{country}/metadata` for the whole model at start, and saved
 *   reforms as `/v2/user-policies` rows pointing at v1 policies
 *   (`POST /{country}/policy`, `legacy_policy_id`).
 * - 'v2': only the small `/v2/model-catalog` at start; parameters, the
 *   parameter tree and search load on demand from the v2 catalog routes;
 *   saved reforms are `/v2/user-policies` rows pointing at `/v2/policies`
 *   (`policy_id`).
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
 * Pages that only send the browser on into v3 (the country's index, and
 * the bill tracker's old address), by their segments below `[countryId]`.
 */
const REDIRECT_ONLY_PAGES: readonly (readonly string[])[] = [[], ['(calculator)', 'tracker']];

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
