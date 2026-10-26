import { describe, expect, test } from 'vitest';
import {
  metadataRoutesForPage,
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

  test('given a page that only redirects into v3 then, after the switch, no metadata loads', () => {
    expect(metadataRoutesForPage([], 'v2')).toBeNull();
    expect(metadataRoutesForPage(['(calculator)', 'tracker'], 'v2')).toBeNull();
  });

  test('given a page that only redirects, before the switch, then it loads v1 as today', () => {
    expect(metadataRoutesForPage([], 'v1')).toBe('v1');
    expect(metadataRoutesForPage(['(calculator)', 'tracker'], 'v1')).toBe('v1');
  });

  test('given other pages then the route group decides, as before', () => {
    expect(metadataRoutesForPage([V3_WORKSPACE_ROUTE_GROUP, 'build'], 'v2')).toBe('v2');
    expect(metadataRoutesForPage(['(calculator)', 'reports'], 'v2')).toBe('v1');
  });
});
