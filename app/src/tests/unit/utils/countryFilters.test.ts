import { describe, expect, test } from 'vitest';
import {
  filterByCountry,
  filterGeographiesByCountry,
  filterHouseholdsByCountry,
  filterPoliciesByCountry,
} from '@/utils/countryFilters';
import {
  mockFilteredItems,
  mockMixedCountryItems,
  mockUKOnlyItems,
  mockUSOnlyItems,
} from '@/tests/fixtures/utils/countryFiltersMocks';

describe('countryFilters', () => {
  describe('filterByCountry', () => {
    test('given US items and US country then returns all US items', () => {
      // When
      const result = filterByCountry(mockUSOnlyItems, 'us');

      // Then
      expect(result).toHaveLength(3);
      expect(result.every((item) => item.countryId === 'us')).toBe(true);
    });

    test('given UK items and UK country then returns all UK items', () => {
      // When
      const result = filterByCountry(mockUKOnlyItems, 'uk');

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.countryId === 'uk')).toBe(true);
    });

    test('given mixed items and US country then returns only US items', () => {
      // When
      const result = filterByCountry(mockMixedCountryItems, 'us');

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.countryId === 'us')).toBe(true);
      expect(result.map((item) => item.id)).toEqual(['us-1', 'us-2']);
    });

    test('given mixed items and UK country then returns only UK items', () => {
      // When
      const result = filterByCountry(mockMixedCountryItems, 'uk');

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.countryId === 'uk')).toBe(true);
      expect(result.map((item) => item.id)).toEqual(['uk-1', 'uk-2']);
    });

    test('given mixed items and CA country then returns only CA item', () => {
      // When
      const result = filterByCountry(mockMixedCountryItems, 'ca');

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].countryId).toBe('ca');
      expect(result[0].id).toBe('ca-1');
    });

    test('given undefined items then returns empty array', () => {
      // When
      const result = filterByCountry(undefined, 'us');

      // Then
      expect(result).toEqual([]);
    });

    test('given null country then returns empty array', () => {
      // When
      const result = filterByCountry(mockUSOnlyItems, null);

      // Then
      expect(result).toEqual([]);
    });

    test('given empty array then returns empty array', () => {
      // When
      const result = filterByCountry([], 'us');

      // Then
      expect(result).toEqual([]);
    });

    test('given items with no matching country then returns empty array', () => {
      // When
      const result = filterByCountry(mockUSOnlyItems, 'uk');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('filterPoliciesByCountry', () => {
    test('given policy items then filters by country', () => {
      // Given
      const policies = mockFilteredItems.policies;

      // When
      const result = filterPoliciesByCountry(policies, 'us');

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.countryId === 'us')).toBe(true);
    });

    test('given undefined policies then returns empty array', () => {
      // When
      const result = filterPoliciesByCountry(undefined, 'us');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('filterHouseholdsByCountry', () => {
    test('given household items then filters by country', () => {
      // Given
      const households = mockFilteredItems.households;

      // When
      const result = filterHouseholdsByCountry(households, 'uk');

      // Then
      expect(result).toHaveLength(1);
      expect(result.every((h) => h.countryId === 'uk')).toBe(true);
    });

    test('given undefined households then returns empty array', () => {
      // When
      const result = filterHouseholdsByCountry(undefined, 'uk');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('filterGeographiesByCountry', () => {
    test('given geography items then filters by country', () => {
      // Given
      const geographies = mockFilteredItems.geographies;

      // When
      const result = filterGeographiesByCountry(geographies, 'us');

      // Then
      expect(result).toHaveLength(1);
      expect(result.every((g) => g.countryId === 'us')).toBe(true);
    });

    test('given undefined geographies then returns empty array', () => {
      // When
      const result = filterGeographiesByCountry(undefined, 'us');

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    test('given items with different types then preserves all properties', () => {
      // Given
      const items = [
        { id: '1', countryId: 'us', label: 'Test 1', extra: 'data' },
        { id: '2', countryId: 'uk', label: 'Test 2', extra: 'data' },
      ];

      // When
      const result = filterByCountry(items, 'us');

      // Then
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: '1', countryId: 'us', label: 'Test 1', extra: 'data' });
    });

    test('given multiple items with same country then returns all', () => {
      // Given
      const items = [
        { id: '1', countryId: 'us' },
        { id: '2', countryId: 'us' },
        { id: '3', countryId: 'us' },
        { id: '4', countryId: 'us' },
      ];

      // When
      const result = filterByCountry(items, 'us');

      // Then
      expect(result).toHaveLength(4);
    });
  });
});
