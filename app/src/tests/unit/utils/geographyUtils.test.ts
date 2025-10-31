import { describe, expect, it } from 'vitest';
import {
  EXPECTED_COUNTRY_LABELS,
  mockMetadataEmptyRegions,
  mockMetadataWithRegions,
  TEST_COUNTRY_CODES,
  TEST_REGION_CODES,
} from '@/tests/fixtures/utils/geographyUtilsMocks';
import { getCountryLabel, getRegionLabel, getRegionType } from '@/utils/geographyUtils';

describe('geographyUtils', () => {
  describe('getCountryLabel', () => {
    it('given US code then returns United States', () => {
      // When
      const result = getCountryLabel(TEST_COUNTRY_CODES.US);

      // Then
      expect(result).toBe(EXPECTED_COUNTRY_LABELS.US);
    });

    it('given UK code then returns United Kingdom', () => {
      // When
      const result = getCountryLabel(TEST_COUNTRY_CODES.UK);

      // Then
      expect(result).toBe(EXPECTED_COUNTRY_LABELS.UK);
    });

    it('given CA code then returns Canada', () => {
      // When
      const result = getCountryLabel(TEST_COUNTRY_CODES.CA);

      // Then
      expect(result).toBe(EXPECTED_COUNTRY_LABELS.CA);
    });

    it('given unknown code then returns Unknown Country', () => {
      // When
      const result = getCountryLabel(TEST_COUNTRY_CODES.UNKNOWN);

      // Then
      expect(result).toBe(EXPECTED_COUNTRY_LABELS.UNKNOWN);
    });
  });

  describe('getRegionLabel', () => {
    it('given California code then returns California', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionLabel(TEST_REGION_CODES.CALIFORNIA, metadata);

      // Then
      expect(result).toBe('California');
    });

    it('given state/ca format then returns California', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionLabel('state/ca', metadata);

      // Then
      expect(result).toBe('California');
    });

    it('given constituency code then returns label', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionLabel(TEST_REGION_CODES.LONDON, metadata);

      // Then
      expect(result).toBe('Cities of London and Westminster');
    });

    it('given unknown region then returns code', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionLabel('unknown', metadata);

      // Then
      expect(result).toBe('unknown');
    });

    it('given empty metadata then returns code', () => {
      // Given
      const metadata = mockMetadataEmptyRegions();

      // When
      const result = getRegionLabel(TEST_REGION_CODES.CALIFORNIA, metadata);

      // Then
      expect(result).toBe(TEST_REGION_CODES.CALIFORNIA);
    });
  });

  describe('getRegionType', () => {
    it('given US then returns state', () => {
      // When
      const result = getRegionType(TEST_COUNTRY_CODES.US);

      // Then
      expect(result).toBe('state');
    });

    it('given UK then returns constituency', () => {
      // When
      const result = getRegionType(TEST_COUNTRY_CODES.UK);

      // Then
      expect(result).toBe('constituency');
    });

    it('given CA then returns constituency', () => {
      // When
      const result = getRegionType(TEST_COUNTRY_CODES.CA);

      // Then
      expect(result).toBe('constituency');
    });
  });
});
