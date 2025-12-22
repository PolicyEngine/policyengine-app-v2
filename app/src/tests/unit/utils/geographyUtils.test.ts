import { describe, expect, it } from 'vitest';
import {
  EXPECTED_COUNTRY_LABELS,
  EXPECTED_REGION_TYPE_LABELS,
  mockEmptyRegions,
  mockRegionsWithData,
  TEST_COUNTRY_CODES,
  TEST_REGION_CODES,
} from '@/tests/fixtures/utils/geographyUtilsMocks';
import type { Geography } from '@/types/ingredients/Geography';
import {
  getCountryLabel,
  getRegionLabel,
  getRegionTypeLabel,
  getUKRegionTypeFromGeography,
  isUKLocalLevelGeography,
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
      const regions = mockRegionsWithData();

      // When
      const result = getRegionLabel(TEST_REGION_CODES.CALIFORNIA, regions);

      // Then
      expect(result).toBe('California');
    });

    it('given state/ca format then returns California', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionLabel('state/ca', regions);

      // Then
      expect(result).toBe('California');
    });

    it('given constituency code then returns label', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionLabel(TEST_REGION_CODES.LONDON, regions);

      // Then
      expect(result).toBe('Cities of London and Westminster');
    });

    it('given unknown region then returns code', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionLabel('unknown', regions);

      // Then
      expect(result).toBe('unknown');
    });

    it('given empty regions then returns code', () => {
      // Given
      const regions = mockEmptyRegions();

      // When
      const result = getRegionLabel(TEST_REGION_CODES.CALIFORNIA, regions);

      // Then
      expect(result).toBe(TEST_REGION_CODES.CALIFORNIA);
    });

    it('given UK constituency with prefix then returns label via exact match', () => {
      // Given
      const regions = mockRegionsWithData();
      const regionCode = TEST_REGION_CODES.UK_CONSTITUENCY_PREFIXED;

      // When
      const result = getRegionLabel(regionCode, regions);

      // Then
      expect(result).toBe('Sheffield Central');
    });

    it('given UK country with prefix then returns label via exact match', () => {
      // Given
      const regions = mockRegionsWithData();
      const regionCode = TEST_REGION_CODES.UK_COUNTRY_PREFIXED;

      // When
      const result = getRegionLabel(regionCode, regions);

      // Then
      expect(result).toBe('England');
    });

    it('given unprefixed UK region then tries fallback with prefix', () => {
      // Given
      const regions = mockRegionsWithData();
      const unprefixedCode = 'Sheffield Central';

      // When
      const result = getRegionLabel(unprefixedCode, regions);

      // Then
      // Should find it by adding the constituency/ prefix
      expect(result).toBe('Sheffield Central');
    });

    it('given congressional district with prefix then returns label', () => {
      // Given
      const regions = mockRegionsWithData();
      const regionCode = TEST_REGION_CODES.US_CONGRESSIONAL_DISTRICT_PREFIXED;

      // When
      const result = getRegionLabel(regionCode, regions);

      // Then
      expect(result).toBe("California's 1st congressional district");
    });

    it('given legacy US state code (tx) without prefix then finds via fallback', () => {
      // Given
      const regions = mockRegionsWithData();
      const legacyCode = TEST_REGION_CODES.US_LEGACY_STATE_TX;

      // When
      const result = getRegionLabel(legacyCode, regions);

      // Then
      expect(result).toBe('Texas');
    });
  });

  describe('getRegionTypeLabel', () => {
    it('given US state then returns State', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionTypeLabel(
        TEST_COUNTRY_CODES.US,
        TEST_REGION_CODES.CALIFORNIA,
        regions
      );

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.STATE);
    });

    it('given UK country then returns Country', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, TEST_REGION_CODES.WALES, regions);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.COUNTRY);
    });

    it('given UK constituency then returns Constituency', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, TEST_REGION_CODES.LONDON, regions);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.CONSTITUENCY);
    });

    it('given region not found then returns Region as fallback', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, 'unknown-region', regions);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.REGION);
    });

    it('given unknown country then returns Region as fallback', () => {
      // Given
      const regions = mockRegionsWithData();

      // When
      const result = getRegionTypeLabel('zz', 'some-region', regions);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.REGION);
    });

    it('given empty regions then returns Region as fallback', () => {
      // Given
      const regions = mockEmptyRegions();

      // When
      const resultUS = getRegionTypeLabel(TEST_COUNTRY_CODES.US, 'ca', regions);
      const resultUK = getRegionTypeLabel(TEST_COUNTRY_CODES.UK, 'wales', regions);

      // Then
      // Without region data, both return generic 'Region' fallback
      expect(resultUS).toBe(EXPECTED_REGION_TYPE_LABELS.REGION);
      expect(resultUK).toBe(EXPECTED_REGION_TYPE_LABELS.REGION);
    });

    it('given US congressional district with prefix then returns Congressional district', () => {
      // Given
      const regions = mockRegionsWithData();
      const regionCode = TEST_REGION_CODES.US_CONGRESSIONAL_DISTRICT_PREFIXED;

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.US, regionCode, regions);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.CONGRESSIONAL_DISTRICT);
    });

    it('given legacy US state code (tx) then returns State via fallback', () => {
      // Given
      const regions = mockRegionsWithData();
      const legacyCode = TEST_REGION_CODES.US_LEGACY_STATE_TX;

      // When
      const result = getRegionTypeLabel(TEST_COUNTRY_CODES.US, legacyCode, regions);

      // Then
      expect(result).toBe(EXPECTED_REGION_TYPE_LABELS.STATE);
    });
  });

  describe('getUKRegionTypeFromGeography', () => {
    it('given UK national geography then returns national', () => {
      // Given
      const geography: Geography = {
        id: 'uk-uk',
        countryId: 'uk',
        scope: 'national',
        geographyId: 'uk',
      };

      // When
      const result = getUKRegionTypeFromGeography(geography);

      // Then
      expect(result).toBe('national');
    });

    it('given UK country-level geography then returns country', () => {
      // Given
      const geography: Geography = {
        id: 'uk-england',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'country/england',
      };

      // When
      const result = getUKRegionTypeFromGeography(geography);

      // Then
      expect(result).toBe('country');
    });

    it('given UK constituency geography then returns constituency', () => {
      // Given
      const geography: Geography = {
        id: 'uk-sheffield-central',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'constituency/Sheffield Central',
      };

      // When
      const result = getUKRegionTypeFromGeography(geography);

      // Then
      expect(result).toBe('constituency');
    });

    it('given UK local authority geography then returns local_authority', () => {
      // Given
      const geography: Geography = {
        id: 'uk-manchester',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'local_authority/Manchester',
      };

      // When
      const result = getUKRegionTypeFromGeography(geography);

      // Then
      expect(result).toBe('local_authority');
    });

    it('given US geography then returns null', () => {
      // Given
      const geography: Geography = {
        id: 'us-ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'state/ca',
      };

      // When
      const result = getUKRegionTypeFromGeography(geography);

      // Then
      expect(result).toBeNull();
    });

    it('given UK geography with unknown prefix then returns null', () => {
      // Given
      const geography: Geography = {
        id: 'uk-unknown',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'unknown/region',
      };

      // When
      const result = getUKRegionTypeFromGeography(geography);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('isUKLocalLevelGeography', () => {
    it('given UK national geography then returns false', () => {
      // Given
      const geography: Geography = {
        id: 'uk-uk',
        countryId: 'uk',
        scope: 'national',
        geographyId: 'uk',
      };

      // When
      const result = isUKLocalLevelGeography(geography);

      // Then
      expect(result).toBe(false);
    });

    it('given UK country-level geography then returns false', () => {
      // Given
      const geography: Geography = {
        id: 'uk-england',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'country/england',
      };

      // When
      const result = isUKLocalLevelGeography(geography);

      // Then
      expect(result).toBe(false);
    });

    it('given UK constituency geography then returns true', () => {
      // Given
      const geography: Geography = {
        id: 'uk-sheffield-central',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'constituency/Sheffield Central',
      };

      // When
      const result = isUKLocalLevelGeography(geography);

      // Then
      expect(result).toBe(true);
    });

    it('given UK local authority geography then returns true', () => {
      // Given
      const geography: Geography = {
        id: 'uk-manchester',
        countryId: 'uk',
        scope: 'subnational',
        geographyId: 'local_authority/Manchester',
      };

      // When
      const result = isUKLocalLevelGeography(geography);

      // Then
      expect(result).toBe(true);
    });

    it('given US geography then returns false', () => {
      // Given
      const geography: Geography = {
        id: 'us-ca',
        countryId: 'us',
        scope: 'subnational',
        geographyId: 'state/ca',
      };

      // When
      const result = isUKLocalLevelGeography(geography);

      // Then
      expect(result).toBe(false);
    });
  });
});
