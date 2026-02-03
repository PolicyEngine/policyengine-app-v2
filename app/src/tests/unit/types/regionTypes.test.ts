import { describe, expect, test } from 'vitest';
import {
  EXPECTED_UK_REGION_TYPES,
  EXPECTED_US_REGION_TYPES,
  INVALID_SCOPE_VALUES,
  VALID_UK_SCOPE_VALUES,
  VALID_US_SCOPE_VALUES,
} from '@/tests/fixtures/types/regionTypesMocks';
import {
  isUKScopeType,
  isUSScopeType,
  UK_REGION_TYPES,
  US_REGION_TYPES,
} from '@/types/regionTypes';

describe('regionTypes', () => {
  describe('US_REGION_TYPES', () => {
    test('given US_REGION_TYPES then contains NATIONAL constant', () => {
      // Given / When / Then
      expect(US_REGION_TYPES.NATIONAL).toBe(EXPECTED_US_REGION_TYPES.NATIONAL);
    });

    test('given US_REGION_TYPES then contains STATE constant', () => {
      // Given / When / Then
      expect(US_REGION_TYPES.STATE).toBe(EXPECTED_US_REGION_TYPES.STATE);
    });

    test('given US_REGION_TYPES then contains CONGRESSIONAL_DISTRICT constant', () => {
      // Given / When / Then
      expect(US_REGION_TYPES.CONGRESSIONAL_DISTRICT).toBe(
        EXPECTED_US_REGION_TYPES.CONGRESSIONAL_DISTRICT
      );
    });

    test('given US_REGION_TYPES then contains PLACE constant', () => {
      // Given / When / Then
      expect(US_REGION_TYPES.PLACE).toBe(EXPECTED_US_REGION_TYPES.PLACE);
    });

    test('given US_REGION_TYPES then does not contain CITY constant', () => {
      // Given / When / Then
      expect(US_REGION_TYPES).not.toHaveProperty('CITY');
    });

    test('given US_REGION_TYPES then has exactly 4 region types', () => {
      // Given / When
      const keys = Object.keys(US_REGION_TYPES);

      // Then
      expect(keys).toHaveLength(4);
      expect(keys).toContain('NATIONAL');
      expect(keys).toContain('STATE');
      expect(keys).toContain('CONGRESSIONAL_DISTRICT');
      expect(keys).toContain('PLACE');
    });
  });

  describe('UK_REGION_TYPES', () => {
    test('given UK_REGION_TYPES then contains NATIONAL constant', () => {
      // Given / When / Then
      expect(UK_REGION_TYPES.NATIONAL).toBe(EXPECTED_UK_REGION_TYPES.NATIONAL);
    });

    test('given UK_REGION_TYPES then contains COUNTRY constant', () => {
      // Given / When / Then
      expect(UK_REGION_TYPES.COUNTRY).toBe(EXPECTED_UK_REGION_TYPES.COUNTRY);
    });

    test('given UK_REGION_TYPES then contains CONSTITUENCY constant', () => {
      // Given / When / Then
      expect(UK_REGION_TYPES.CONSTITUENCY).toBe(EXPECTED_UK_REGION_TYPES.CONSTITUENCY);
    });

    test('given UK_REGION_TYPES then contains LOCAL_AUTHORITY constant', () => {
      // Given / When / Then
      expect(UK_REGION_TYPES.LOCAL_AUTHORITY).toBe(EXPECTED_UK_REGION_TYPES.LOCAL_AUTHORITY);
    });

    test('given UK_REGION_TYPES then has exactly 4 region types', () => {
      // Given / When
      const keys = Object.keys(UK_REGION_TYPES);

      // Then
      expect(keys).toHaveLength(4);
      expect(keys).toContain('NATIONAL');
      expect(keys).toContain('COUNTRY');
      expect(keys).toContain('CONSTITUENCY');
      expect(keys).toContain('LOCAL_AUTHORITY');
    });
  });

  describe('isUSScopeType', () => {
    test.each(VALID_US_SCOPE_VALUES)('given valid US scope "%s" then returns true', (scope) => {
      // Given / When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test.each(INVALID_SCOPE_VALUES)('given invalid scope "%s" then returns false', (scope) => {
      // Given / When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(false);
    });

    test('given "place" scope then returns true', () => {
      // Given
      const scope = 'place';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given "city" scope then returns false', () => {
      // Given
      const scope = 'city';

      // When
      const result = isUSScopeType(scope);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('isUKScopeType', () => {
    test.each(VALID_UK_SCOPE_VALUES)('given valid UK scope "%s" then returns true', (scope) => {
      // Given / When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test.each(INVALID_SCOPE_VALUES)('given invalid scope "%s" then returns false', (scope) => {
      // Given / When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(false);
    });

    test('given "constituency" scope then returns true', () => {
      // Given
      const scope = 'constituency';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(true);
    });

    test('given "place" scope then returns false', () => {
      // Given
      const scope = 'place';

      // When
      const result = isUKScopeType(scope);

      // Then
      expect(result).toBe(false);
    });
  });
});
