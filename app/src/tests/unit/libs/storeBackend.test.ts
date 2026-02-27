import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getStoreBackend } from '@/libs/storeBackend';
import { MIGRATION_FLAG_KEY } from '@/libs/v1Migration';

describe('storeBackend', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getStoreBackend', () => {
    test('given migration not complete then returns localStorage', () => {
      const result = getStoreBackend();

      expect(result).toBe('localStorage');
    });

    test('given migration flag is set then still returns localStorage', () => {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

      const result = getStoreBackend();

      // localStorage is forced until real auth is implemented
      expect(result).toBe('localStorage');
    });

    test('given migration flag has unexpected value then returns localStorage', () => {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'false');

      const result = getStoreBackend();

      expect(result).toBe('localStorage');
    });
  });
});
