import { describe, expect, test } from 'vitest';
import {
  createGeographyFromScope,
  extractRegionDisplayValue,
  getUKConstituencies,
  getUKCountries,
  getUSStates,
} from '@/utils/regionStrategies';
import {
  expectedUKConstituencies,
  expectedUKCountries,
  expectedUSStates,
  mockUKRegions,
  mockUSRegions,
  TEST_REGIONS,
} from '@/tests/fixtures/utils/regionStrategiesMocks';

describe('regionStrategies', () => {
  describe('getUSStates', () => {
    test('given US regions then returns states excluding national entry', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUSStates(regions);

      // Then
      expect(result).toEqual(expectedUSStates);
      expect(result).not.toContainEqual({ value: 'us', label: 'the US' });
    });

    test('given empty regions then returns empty array', () => {
      // Given
      const regions: typeof mockUSRegions = [];

      // When
      const result = getUSStates(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getUKCountries', () => {
    test('given UK regions then returns only country entries with prefix', () => {
      // Given
      const regions = mockUKRegions;

      // When
      const result = getUKCountries(regions);

      // Then
      expect(result).toEqual(expectedUKCountries);
      expect(result.every((r) => r.value.startsWith('country/'))).toBe(true);
    });

    test('given regions with no countries then returns empty array', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUKCountries(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getUKConstituencies', () => {
    test('given UK regions then returns only constituency entries with prefix', () => {
      // Given
      const regions = mockUKRegions;

      // When
      const result = getUKConstituencies(regions);

      // Then
      expect(result).toEqual(expectedUKConstituencies);
      expect(result.every((r) => r.value.startsWith('constituency/'))).toBe(true);
    });

    test('given regions with no constituencies then returns empty array', () => {
      // Given
      const regions = mockUSRegions;

      // When
      const result = getUKConstituencies(regions);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('extractRegionDisplayValue', () => {
    test('given UK constituency with prefix then strips prefix', () => {
      // Given
      const fullValue = TEST_REGIONS.UK_CONSTITUENCY_PREFIXED;

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe(TEST_REGIONS.UK_CONSTITUENCY_DISPLAY);
    });

    test('given UK country with prefix then strips prefix', () => {
      // Given
      const fullValue = TEST_REGIONS.UK_COUNTRY_PREFIXED;

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe(TEST_REGIONS.UK_COUNTRY_DISPLAY);
    });

    test('given US state without prefix then returns as-is', () => {
      // Given
      const fullValue = TEST_REGIONS.US_STATE;

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe(TEST_REGIONS.US_STATE);
    });

    test('given national identifier then returns as-is', () => {
      // Given
      const ukNational = TEST_REGIONS.UK_NATIONAL;
      const usNational = TEST_REGIONS.US_NATIONAL;

      // When
      const ukResult = extractRegionDisplayValue(ukNational);
      const usResult = extractRegionDisplayValue(usNational);

      // Then
      expect(ukResult).toBe(TEST_REGIONS.UK_NATIONAL);
      expect(usResult).toBe(TEST_REGIONS.US_NATIONAL);
    });

    test('given value with multiple slashes then returns last segment', () => {
      // Given
      const fullValue = 'country/region/city';

      // When
      const result = extractRegionDisplayValue(fullValue);

      // Then
      expect(result).toBe('city');
    });
  });

  describe('createGeographyFromScope', () => {
    test('given household scope then returns null', () => {
      // Given
      const scope = 'household' as const;
      const countryId = 'uk' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toBeNull();
    });

    test('given national scope for UK then returns geography with country ID', () => {
      // Given
      const scope = 'national' as const;
      const countryId = 'uk' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toEqual({
        id: 'uk',
        countryId: 'uk',
        scope: 'national',
        geographyId: 'uk',
      });
    });

    test('given national scope for US then returns geography with country ID', () => {
      // Given
      const scope = 'national' as const;
      const countryId = 'us' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toEqual({
        id: 'us',
        countryId: 'us',
        scope: 'national',
        geographyId: 'us',
      });
    });

    test('given UK constituency scope then stores full prefixed value', () => {
      // Given
      const scope = 'constituency' as const;
      const countryId = 'uk' as const;
      const selectedRegion = TEST_REGIONS.UK_CONSTITUENCY_PREFIXED;

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'uk-Sheffield Central', // ID uses display value
        countryId: 'uk',
        scope: 'subnational',
        geographyId: TEST_REGIONS.UK_CONSTITUENCY_PREFIXED, // Stores FULL prefixed value
      });
    });

    test('given UK country scope then stores full prefixed value', () => {
      // Given
      const scope = 'country' as const;
      const countryId = 'uk' as const;
      const selectedRegion = TEST_REGIONS.UK_COUNTRY_PREFIXED;

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'uk-england', // ID uses display value
        countryId: 'uk',
        scope: 'subnational',
        geographyId: TEST_REGIONS.UK_COUNTRY_PREFIXED, // Stores FULL prefixed value
      });
    });

    test('given US state scope then stores state code without prefix', () => {
      // Given
      const scope = 'state' as const;
      const countryId = 'us' as const;
      const selectedRegion = TEST_REGIONS.US_STATE;

      // When
      const result = createGeographyFromScope(scope, countryId, selectedRegion);

      // Then
      expect(result).toEqual({
        id: 'us-ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: TEST_REGIONS.US_STATE, // No prefix for US
      });
    });

    test('given subnational scope without selected region then returns null', () => {
      // Given
      const scope = 'constituency' as const;
      const countryId = 'uk' as const;

      // When
      const result = createGeographyFromScope(scope, countryId);

      // Then
      expect(result).toBeNull();
    });
  });
});
