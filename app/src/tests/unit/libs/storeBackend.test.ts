import { describe, expect, test } from 'vitest';
import { getStoreBackend } from '@/libs/storeBackend';

describe('storeBackend', () => {
  describe('getStoreBackend', () => {
    test('given default state then returns api', () => {
      const result = getStoreBackend();

      expect(result).toBe('api');
    });
  });
});
