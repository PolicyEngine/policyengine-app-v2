import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isV2EntityId } from '@/hooks/utils/queryUtils';
import { TEST_IDS } from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('isV2EntityId', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  describe('valid UUIDs', () => {
    test('given a lowercase UUID then it returns true', () => {
      // Given
      const id = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(true);
    });

    test('given an uppercase UUID then it returns true', () => {
      // Given
      const id = '550E8400-E29B-41D4-A716-446655440000';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(true);
    });

    test('given a mixed-case UUID then it returns true', () => {
      // Given
      const id = '550e8400-E29B-41d4-A716-446655440000';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(true);
    });

    test('given a UUID from the shared test fixtures then it returns true', () => {
      // Given
      const id = TEST_IDS.MODEL_ID;

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('integer strings', () => {
    test('given "123" then it returns false', () => {
      // Given
      const id = '123';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(false);
    });

    test('given "456" then it returns false', () => {
      // Given
      const id = '456';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('empty string', () => {
    test('given an empty string then it returns false', () => {
      // Given
      const id = '';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('random strings', () => {
    test('given "abc" then it returns false', () => {
      // Given
      const id = 'abc';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(false);
    });

    test('given "not-a-uuid" then it returns false', () => {
      // Given
      const id = 'not-a-uuid';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('UUID without dashes', () => {
    test('given a UUID with dashes removed then it returns false', () => {
      // Given
      const id = '550e8400e29b41d4a716446655440000';

      // When
      const result = isV2EntityId(id);

      // Then
      expect(result).toBe(false);
    });
  });
});
