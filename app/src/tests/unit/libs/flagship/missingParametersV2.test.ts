import { describe, expect, test, vi } from 'vitest';
import { catalogMissingNamesForRoutes } from '@/libs/flagship/missingParameters';
import { REMOVED_US_PARAMETER } from '@/tests/fixtures/libs/flagship/missingParametersMocks';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

describe('catalogMissingNamesForRoutes with v3 on the v2 routes', () => {
  test('given names the catalog lacks then they are passed', () => {
    expect(catalogMissingNamesForRoutes([REMOVED_US_PARAMETER])).toEqual([REMOVED_US_PARAMETER]);
  });

  test('given the catalog has reported none yet then an empty list is passed, so unloaded paths are not judged', () => {
    expect(catalogMissingNamesForRoutes(undefined)).toEqual([]);
  });
});
