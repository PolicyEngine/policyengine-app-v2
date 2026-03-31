import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getStoreBackend } from '@/libs/storeBackend';

vi.stubGlobal('fetch', vi.fn());

describe('getStoreBackend', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  test("given the function is called then it returns 'api'", () => {
    // Given / When
    const result = getStoreBackend();

    // Then
    expect(result).toBe('api');
  });

  test('given multiple invocations then it consistently returns api', () => {
    // Given / When
    const results = [getStoreBackend(), getStoreBackend(), getStoreBackend()];

    // Then
    expect(results).toEqual(['api', 'api', 'api']);
  });

  test('given the return type then it satisfies the StoreBackend union', () => {
    // Given / When
    const result = getStoreBackend();

    // Then
    const validBackends = ['api', 'localStorage'];
    expect(validBackends).toContain(result);
  });
});
