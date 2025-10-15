import { describe, expect, test } from 'vitest';
import {
  filterUSStates,
  filterUKCountries,
  filterUKConstituencies,
} from '@/utils/regionFilters';

describe('regionFilters', () => {
  const mockRegionOptions = [
    { name: 'us', label: 'United States' },
    { name: 'state/ca', label: 'California' },
    { name: 'state/ny', label: 'New York' },
    { name: 'state/tx', label: 'Texas' },
    { name: 'uk', label: 'United Kingdom' },
    { name: 'country/england', label: 'England' },
    { name: 'country/scotland', label: 'Scotland' },
    { name: 'country/wales', label: 'Wales' },
    { name: 'constituency/london', label: 'London' },
    { name: 'constituency/manchester', label: 'Manchester' },
    { name: 'constituency/brighton', label: 'Brighton' },
  ];

  describe('filterUSStates', () => {
    test('given region options then returns only US states', () => {
      // When
      const result = filterUSStates(mockRegionOptions);

      // Then
      expect(result).toEqual([
        { value: 'state/ca', label: 'California' },
        { value: 'state/ny', label: 'New York' },
        { value: 'state/tx', label: 'Texas' },
      ]);
    });

    test('given region options then excludes national us option', () => {
      // When
      const result = filterUSStates(mockRegionOptions);

      // Then
      expect(result.find((r) => r.value === 'us')).toBeUndefined();
    });

    test('given region options then excludes UK regions', () => {
      // When
      const result = filterUSStates(mockRegionOptions);

      // Then
      expect(result.find((r) => r.value.startsWith('country/'))).toBeUndefined();
      expect(result.find((r) => r.value.startsWith('constituency/'))).toBeUndefined();
    });

    test('given empty array then returns empty array', () => {
      // When
      const result = filterUSStates([]);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('filterUKCountries', () => {
    test('given region options then returns only UK countries', () => {
      // When
      const result = filterUKCountries(mockRegionOptions);

      // Then
      expect(result).toEqual([
        { value: 'country/england', label: 'England' },
        { value: 'country/scotland', label: 'Scotland' },
        { value: 'country/wales', label: 'Wales' },
      ]);
    });

    test('given region options then excludes constituencies', () => {
      // When
      const result = filterUKCountries(mockRegionOptions);

      // Then
      expect(result.find((r) => r.value.startsWith('constituency/'))).toBeUndefined();
    });

    test('given region options then excludes US regions', () => {
      // When
      const result = filterUKCountries(mockRegionOptions);

      // Then
      expect(result.find((r) => r.value.startsWith('state/'))).toBeUndefined();
    });

    test('given empty array then returns empty array', () => {
      // When
      const result = filterUKCountries([]);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('filterUKConstituencies', () => {
    test('given region options then returns only UK constituencies', () => {
      // When
      const result = filterUKConstituencies(mockRegionOptions);

      // Then
      expect(result).toEqual([
        { value: 'constituency/london', label: 'London' },
        { value: 'constituency/manchester', label: 'Manchester' },
        { value: 'constituency/brighton', label: 'Brighton' },
      ]);
    });

    test('given region options then excludes countries', () => {
      // When
      const result = filterUKConstituencies(mockRegionOptions);

      // Then
      expect(result.find((r) => r.value.startsWith('country/'))).toBeUndefined();
    });

    test('given region options then excludes US regions', () => {
      // When
      const result = filterUKConstituencies(mockRegionOptions);

      // Then
      expect(result.find((r) => r.value.startsWith('state/'))).toBeUndefined();
    });

    test('given empty array then returns empty array', () => {
      // When
      const result = filterUKConstituencies([]);

      // Then
      expect(result).toEqual([]);
    });
  });
});
