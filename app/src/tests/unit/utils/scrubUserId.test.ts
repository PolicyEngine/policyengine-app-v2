import { describe, expect, test } from 'vitest';
import { scrubUserId, scrubUserIdArray } from '@/utils/scrubUserId';

describe('scrubUserId', () => {
  test('given object with userId then replaces with [scrubbed]', () => {
    // Given
    const obj = { id: '123', userId: 'secret-user-id', name: 'Test' };

    // When
    const result = scrubUserId(obj);

    // Then
    expect(result.userId).toBe('[scrubbed]');
    expect(result.id).toBe('123');
    expect(result.name).toBe('Test');
  });

  test('given object with user_id (snake_case) then replaces with [scrubbed]', () => {
    // Given
    const obj = { id: '123', user_id: 'secret-user-id', name: 'Test' };

    // When
    const result = scrubUserId(obj);

    // Then
    expect(result.user_id).toBe('[scrubbed]');
    expect(result.id).toBe('123');
  });

  test('given object with both userId and user_id then replaces both', () => {
    // Given
    const obj = { userId: 'camel-case-id', user_id: 'snake-case-id' };

    // When
    const result = scrubUserId(obj);

    // Then
    expect(result.userId).toBe('[scrubbed]');
    expect(result.user_id).toBe('[scrubbed]');
  });

  test('given object without userId then returns object unchanged', () => {
    // Given
    const obj = { id: '123', name: 'Test', email: 'test@example.com' };

    // When
    const result = scrubUserId(obj);

    // Then
    expect(result).toEqual(obj);
  });

  test('given null then returns null', () => {
    // Given/When
    const result = scrubUserId(null);

    // Then
    expect(result).toBeNull();
  });

  test('given undefined then returns undefined', () => {
    // Given/When
    const result = scrubUserId(undefined);

    // Then
    expect(result).toBeUndefined();
  });

  test('given primitive value then returns value unchanged', () => {
    // Given/When/Then
    expect(scrubUserId('string')).toBe('string');
    expect(scrubUserId(123)).toBe(123);
    expect(scrubUserId(true)).toBe(true);
  });

  test('given object then does not mutate original', () => {
    // Given
    const original = { id: '123', userId: 'secret-user-id' };
    const originalUserId = original.userId;

    // When
    scrubUserId(original);

    // Then
    expect(original.userId).toBe(originalUserId);
  });
});

describe('scrubUserIdArray', () => {
  test('given array of objects with userId then scrubs all', () => {
    // Given
    const arr = [
      { id: '1', userId: 'user-1' },
      { id: '2', userId: 'user-2' },
      { id: '3', userId: 'user-3' },
    ];

    // When
    const result = scrubUserIdArray(arr);

    // Then
    expect(result).toHaveLength(3);
    expect(result![0].userId).toBe('[scrubbed]');
    expect(result![1].userId).toBe('[scrubbed]');
    expect(result![2].userId).toBe('[scrubbed]');
    expect(result![0].id).toBe('1');
    expect(result![1].id).toBe('2');
    expect(result![2].id).toBe('3');
  });

  test('given null then returns null', () => {
    // Given/When
    const result = scrubUserIdArray(null);

    // Then
    expect(result).toBeNull();
  });

  test('given undefined then returns null', () => {
    // Given/When
    const result = scrubUserIdArray(undefined);

    // Then
    expect(result).toBeNull();
  });

  test('given empty array then returns empty array', () => {
    // Given/When
    const result = scrubUserIdArray([]);

    // Then
    expect(result).toEqual([]);
  });

  test('given mixed array with some objects having userId then scrubs only those', () => {
    // Given
    const arr = [
      { id: '1', userId: 'user-1' },
      { id: '2', name: 'No userId' },
      { id: '3', user_id: 'user-3' },
    ];

    // When
    const result = scrubUserIdArray(arr);

    // Then
    expect(result).toHaveLength(3);
    expect(result![0].userId).toBe('[scrubbed]');
    expect(result![1]).toEqual({ id: '2', name: 'No userId' });
    expect(result![2].user_id).toBe('[scrubbed]');
  });

  test('given array then does not mutate original', () => {
    // Given
    const original = [{ id: '1', userId: 'user-1' }];
    const originalUserId = original[0].userId;

    // When
    scrubUserIdArray(original);

    // Then
    expect(original[0].userId).toBe(originalUserId);
  });
});
