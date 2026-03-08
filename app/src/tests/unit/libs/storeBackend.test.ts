import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getStoreBackend } from '@/libs/storeBackend';

describe('storeBackend', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getStoreBackend', () => {
    test('given default state then returns localStorage', () => {
      const result = getStoreBackend();

      expect(result).toBe('localStorage');
    });

    test('given any localStorage state then still returns localStorage', () => {
      localStorage.setItem('policyengine_v1_migrated', 'true');

      const result = getStoreBackend();

      // localStorage is forced until real auth is implemented
      expect(result).toBe('localStorage');
    });
  });
});
