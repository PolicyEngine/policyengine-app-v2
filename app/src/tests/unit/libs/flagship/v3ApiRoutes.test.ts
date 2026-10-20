import { describe, expect, test } from 'vitest';
import { metadataRoutesForRouteGroup, V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';

describe('v3ApiRoutes', () => {
  test('given production before the switch then v3 uses the v1 routes', () => {
    // The switch pull request (plan item 4A-1) changes V3_API_ROUTES to 'v2'
    // and this expectation with it.
    expect(V3_API_ROUTES).toBe('v1');
  });

  test('given the v3 workspace route group then metadata follows V3_API_ROUTES', () => {
    expect(metadataRoutesForRouteGroup('(workspace)')).toBe(V3_API_ROUTES);
  });

  test('given the legacy calculator or no route group then metadata stays on v1', () => {
    expect(metadataRoutesForRouteGroup('(calculator)')).toBe('v1');
    expect(metadataRoutesForRouteGroup(null)).toBe('v1');
  });
});
