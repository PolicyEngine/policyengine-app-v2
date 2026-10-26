import { describe, expect, test } from 'vitest';
import {
  metadataRoutesForRouteGroup,
  V3_API_ROUTES,
  V3_WORKSPACE_ROUTE_GROUP,
} from '@/libs/flagship/v3ApiRoutes';

describe('v3ApiRoutes', () => {
  test('given this release then v3 still uses the v1 routes until the switch', () => {
    expect(V3_API_ROUTES).toBe('v1');
  });

  test('given the v3 workspace route group then metadata follows the routes v3 uses', () => {
    expect(metadataRoutesForRouteGroup(V3_WORKSPACE_ROUTE_GROUP, 'v2')).toBe('v2');
    expect(metadataRoutesForRouteGroup(V3_WORKSPACE_ROUTE_GROUP, 'v1')).toBe('v1');
    expect(metadataRoutesForRouteGroup(V3_WORKSPACE_ROUTE_GROUP)).toBe(V3_API_ROUTES);
  });

  test('given the older report builder or no route group then metadata stays on v1', () => {
    expect(metadataRoutesForRouteGroup('(calculator)', 'v2')).toBe('v1');
    expect(metadataRoutesForRouteGroup(null, 'v2')).toBe('v1');
  });
});
