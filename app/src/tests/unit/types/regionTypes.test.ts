import { describe, expect, test } from 'vitest';
import {
  US_REGION_TYPES,
  UK_REGION_TYPES,
  isUSScopeType,
  isUKScopeType,
} from '@/types/regionTypes';

describe('regionTypes', () => {
  describe('US_REGION_TYPES', () => {
    test('given US region types then contains expected values', () => {
      // Then
      expect(US_REGION_TYPES.NATIONAL).toBe('national');
      expect(US_REGION_TYPES.STATE).toBe('state');
      expect(US_REGION_TYPES.CONGRESSIONAL_DISTRICT).toBe('congressional_district');
      expect(US_REGION_TYPES.CITY).toBe('city');
    });
  });

  describe('UK_REGION_TYPES', () => {
    test('given UK region types then contains expected values', () => {
      // Then
      expect(UK_REGION_TYPES.NATIONAL).toBe('national');
      expect(UK_REGION_TYPES.COUNTRY).toBe('country');
      expect(UK_REGION_TYPES.CONSTITUENCY).toBe('constituency');
    });
  });

  describe('isUSScopeType', () => {
    test('given national scope then returns true', () => {
      // Given
      const scope = 'national';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given state scope then returns true', () => {
      // Given
      const scope = 'state';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given congressional_district scope then returns true', () => {
      // Given
      const scope = 'congressional_district';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given city scope then returns true', () => {
      // Given
      const scope = 'city';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given household scope then returns true', () => {
      // Given
      const scope = 'household';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given UK-only scope (constituency) then returns false', () => {
      // Given
      const scope = 'constituency';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(false);
    });

    test('given invalid scope then returns false', () => {
      // Given
      const scope = 'invalid_scope';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('isUKScopeType', () => {
    test('given national scope then returns true', () => {
      // Given
      const scope = 'national';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given country scope then returns true', () => {
      // Given
      const scope = 'country';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given constituency scope then returns true', () => {
      // Given
      const scope = 'constituency';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given household scope then returns true', () => {
      // Given
      const scope = 'household';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given US-only scope (state) then returns false', () => {
      // Given
      const scope = 'state';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(false);
    });

    test('given US-only scope (congressional_district) then returns false', () => {
      // Given
      const scope = 'congressional_district';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(false);
    });

    test('given invalid scope then returns false', () => {
      // Given
      const scope = 'invalid_scope';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(false);
    });
  });
});
