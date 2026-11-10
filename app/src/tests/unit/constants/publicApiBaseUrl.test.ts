import { afterEach, describe, expect, test, vi } from 'vitest';
import { PUBLIC_API_ROUTE_PREFIX } from '@/libs/publicApiRoute/allowList';

const PRODUCTION_PUBLIC_API_URL = 'https://api.policyengine.org';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('BASE_URL', () => {
  test("given the calculator then the Public API's address is its own same-origin route", async () => {
    // When
    const { BASE_URL } = await import('@/constants');

    // Then
    expect(BASE_URL).toBe(PUBLIC_API_ROUTE_PREFIX);
  });

  test('given VITE_API_URL names the Public API then browsers still call the route, not the Public API', async () => {
    // Given
    vi.stubEnv('VITE_API_URL', PRODUCTION_PUBLIC_API_URL);
    vi.resetModules();

    // When
    const { BASE_URL } = await import('@/constants');

    // Then
    expect(BASE_URL).toBe(PUBLIC_API_ROUTE_PREFIX);
  });
});
