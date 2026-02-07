import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  clearMigrationFlag,
  clearUserId,
  getUserId,
  isMigrationComplete,
  markMigrationComplete,
  STORAGE_KEYS,
} from '@/libs/userIdentity';

describe('userIdentity', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock crypto.randomUUID
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-1234-5678-90ab-cdef12345678');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getUserId', () => {
    test('given no existing user ID then generates and stores new UUID', () => {
      // When
      const userId = getUserId();

      // Then
      expect(userId).toBe('test-uuid-1234-5678-90ab-cdef12345678');
      expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBe(
        'test-uuid-1234-5678-90ab-cdef12345678'
      );
      expect(crypto.randomUUID).toHaveBeenCalled();
    });

    test('given existing user ID then returns stored ID without generating new one', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.USER_ID, 'existing-user-id-12345');

      // When
      const userId = getUserId();

      // Then
      expect(userId).toBe('existing-user-id-12345');
      expect(crypto.randomUUID).not.toHaveBeenCalled();
    });

    test('given multiple calls then returns same user ID', () => {
      // When
      const userId1 = getUserId();
      const userId2 = getUserId();
      const userId3 = getUserId();

      // Then
      expect(userId1).toBe(userId2);
      expect(userId2).toBe(userId3);
      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearUserId', () => {
    test('given user ID exists then removes it from localStorage', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.USER_ID, 'existing-user-id');

      // When
      clearUserId();

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBeNull();
    });

    test('given user ID cleared then next getUserId generates new ID', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.USER_ID, 'old-user-id');

      // When
      clearUserId();
      const newUserId = getUserId();

      // Then
      expect(newUserId).toBe('test-uuid-1234-5678-90ab-cdef12345678');
      expect(newUserId).not.toBe('old-user-id');
    });
  });

  describe('isMigrationComplete', () => {
    test('given no migration flag then returns false', () => {
      // When
      const result = isMigrationComplete();

      // Then
      expect(result).toBe(false);
    });

    test('given migration flag set to true then returns true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, 'true');

      // When
      const result = isMigrationComplete();

      // Then
      expect(result).toBe(true);
    });

    test('given migration flag set to other value then returns false', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, 'false');

      // When
      const result = isMigrationComplete();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('markMigrationComplete', () => {
    test('given migration not complete then sets flag to true', () => {
      // When
      markMigrationComplete();

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETE)).toBe('true');
    });

    test('given migration already complete then flag remains true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, 'true');

      // When
      markMigrationComplete();

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETE)).toBe('true');
    });
  });

  describe('clearMigrationFlag', () => {
    test('given migration flag exists then removes it', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, 'true');

      // When
      clearMigrationFlag();

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETE)).toBeNull();
    });

    test('given migration flag cleared then isMigrationComplete returns false', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETE, 'true');

      // When
      clearMigrationFlag();
      const result = isMigrationComplete();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('STORAGE_KEYS', () => {
    test('given STORAGE_KEYS then contains expected key names', () => {
      // Then
      expect(STORAGE_KEYS.USER_ID).toBe('policyengine_user_id');
      expect(STORAGE_KEYS.MIGRATION_COMPLETE).toBe('policyengine_migration_v2_complete');
    });
  });
});
