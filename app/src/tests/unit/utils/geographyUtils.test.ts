import { describe, expect, it } from 'vitest';
import {
  EXPECTED_COUNTRY_LABELS,
  EXPECTED_REGION_TYPE_LABELS,
  mockMetadataEmptyRegions,
  mockMetadataWithRegions,
  TEST_COUNTRY_CODES,
  TEST_REGION_CODES,
} from '@/tests/fixtures/utils/geographyUtilsMocks';
import {
  getCountryLabel,
  getRegionLabel,
  getRegionType,
  getRegionTypeLabel,
} from '@/utils/geographyUtils';

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

    it('given UK constituency with prefix then returns label via exact match', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const regionCode = TEST_REGION_CODES.UK_CONSTITUENCY_PREFIXED;

      // When
      const result = getRegionLabel(regionCode, metadata);

      // Then
      expect(result).toBe('Sheffield Central');
    });

    it('given UK country with prefix then returns label via exact match', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const regionCode = TEST_REGION_CODES.UK_COUNTRY_PREFIXED;

      // When
      const result = getRegionLabel(regionCode, metadata);

      // Then
      expect(result).toBe('England');
    });

    it('given unprefixed UK region then tries fallback with prefix', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const unprefixedCode = 'Sheffield Central';

      // When
      const result = getRegionLabel(unprefixedCode, metadata);

      // Then
      // Should find it by adding the constituency/ prefix
      expect(result).toBe('Sheffield Central');
    });

    it('given congressional district with prefix then returns label', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const regionCode = TEST_REGION_CODES.US_CONGRESSIONAL_DISTRICT_PREFIXED;

      // When
      const result = getRegionLabel(regionCode, metadata);

      // Then
      expect(result).toBe("California's 1st congressional district");
    });

    it('given legacy US state code (tx) without prefix then finds via fallback', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const legacyCode = TEST_REGION_CODES.US_LEGACY_STATE_TX;

      // When
      const result = getRegionLabel(legacyCode, metadata);

      // Then
      expect(result).toBe('Texas');
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

  describe('getRegionTypeLabel', () => {
    it('given US state then returns State', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionTypeLabel(
        TEST_COUNTRY_CODES.US,
        TEST_REGION_CODES.CALIFORNIA,
        metadata
      );

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.STATE);
    });

    it('given UK country then returns Country', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, TEST_REGION_CODES.WALES, metadata);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.COUNTRY);
    });

    it('given UK constituency then returns Constituency', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, TEST_REGION_CODES.LONDON, metadata);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.CONSTITUENCY);
    });

    it('given UK region not in metadata then returns Constituency as fallback', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, 'unknown-region', metadata);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.CONSTITUENCY);
    });

    it('given unknown country then returns Region as fallback', () => {
      // Given
      const metadata = mockMetadataWithRegions();

      // When
      const result = getRegionTypeLabel('zz', 'some-region', metadata);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.REGION);
    });

    it('given empty metadata then returns appropriate fallback', () => {
      // Given
      const metadata = mockMetadataEmptyRegions();

      // When
      const resultUS = getRegionTypeLabel(TEST_COUNTRY_CODES.US, 'ca', metadata);
      const resultUK = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, 'wales', metadata);

      // Then
      expect(resultUS).toBe(EXPECTED_REGION_TYPE_LABELS.STATE);
      expect(resultUK).toBe(EXPECTED_REGION_TYPE_LABELS.CONSTITUENCY);
    });

    it('given US congressional district with prefix then returns Congressional district', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const regionCode = TEST_REGION_CODES.US_CONGRESSIONAL_DISTRICT_PREFIXED;

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.US, regionCode, metadata);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.CONGRESSIONAL_DISTRICT);
    });

    it('given legacy US state code (tx) then returns State via fallback', () => {
      // Given
      const metadata = mockMetadataWithRegions();
      const legacyCode = TEST_REGION_CODES.US_LEGACY_STATE_TX;

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.US, legacyCode, metadata);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.STATE);
    });
  });
});
