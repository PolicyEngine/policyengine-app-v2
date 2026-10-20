/**
 * Which PolicyEngine API routes the v3 workspace uses.
 *
 * - 'v1': `GET /{country}/metadata` for the model, and saved reforms as
 *   `/v2/user-policies` rows pointing at v1 policies (`POST /{country}/policy`,
 *   `legacy_policy_id`).
 * - 'v2': the model from `/v2/tax-benefit-models/by-country`,
 *   `/v2/model-catalog` and `/v2/regions`, and saved reforms as
 *   `/v2/user-policies` rows pointing at `/v2/policies` (`policy_id`).
 *
 * This constant is the only place v3 chooses. It is not a runtime flag or an
 * environment variable, so every build behaves the same. It stays 'v1' until
 * the switch pull request (plan item 4A-1), which changes this line to 'v2'
 * (and the test that pins it). The legacy calculator, the `(calculator)` route
 * group, stays on v1 regardless.
 */
export type V3ApiRoutes = 'v1' | 'v2';

export const V3_API_ROUTES: V3ApiRoutes = 'v1';

/** The Next.js route group holding the v3 workspace pages. */
export const V3_WORKSPACE_ROUTE_GROUP = '(workspace)';

/**
 * Where model metadata loads from for a page in this route group (the
 * segment below `[countryId]`): v3 follows V3_API_ROUTES; everything else
 * stays on v1.
 */
export function metadataRoutesForRouteGroup(routeGroup: string | null): V3ApiRoutes {
  return routeGroup === V3_WORKSPACE_ROUTE_GROUP ? V3_API_ROUTES : 'v1';
}
