import { describe, expect, test } from 'vitest';
import {
  isUKEconomyOutput,
  extractConstituencyName,
  extractCountryName,
  getRegionKey,
} from '@/utils/constituencyUtils';
import {
  MOCK_GEOGRAPHY_IDS,
  EXPECTED_NAMES,
  EXPECTED_REGION_KEYS,
} from '@/tests/fixtures/utils/constituencyMocks';

describe('constituencyUtils', () => {
  describe('isUKEconomyOutput', () => {
    test('given UK output with constituency_impact then returns true', () => {
      // Given
      const ukOutput = {
        constituency_impact: {},
        budget: {},
        poverty: {},
        intra_decile: {},
      } as any;

      // When
      const result = isUKEconomyOutput(ukOutput);

      // Then
      expect(result).toBe(true);
    });

    test('given US output without constituency_impact then returns false', () => {
      // Given
      const usOutput = {
        budget: {},
        poverty: {},
        intra_decile: {},
      } as any;

      // When
      const result = isUKEconomyOutput(usOutput);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('extractConstituencyName', () => {
    test('given constituency geographyId then extracts name', () => {
      // When
      const result = extractConstituencyName(MOCK_GEOGRAPHY_IDS.CONSTITUENCY_BRIGHTON);

      // Then
      expect(result).toBe(EXPECTED_NAMES.CONSTITUENCY_BRIGHTON);
    });

    test('given another constituency then extracts name correctly', () => {
      // When
      const result = extractConstituencyName(MOCK_GEOGRAPHY_IDS.CONSTITUENCY_ALDERSHOT);

      // Then
      expect(result).toBe(EXPECTED_NAMES.CONSTITUENCY_ALDERSHOT);
    });

    test('given country geographyId then returns null', () => {
      // When
      const result = extractConstituencyName(MOCK_GEOGRAPHY_IDS.COUNTRY_ENGLAND);

      // Then
      expect(result).toBeNull();
    });

    test('given UK national then returns null', () => {
      // When
      const result = extractConstituencyName(MOCK_GEOGRAPHY_IDS.UK_NATIONAL);

      // Then
      expect(result).toBeNull();
    });

    test('given invalid format then returns null', () => {
      // When
      const result = extractConstituencyName(MOCK_GEOGRAPHY_IDS.INVALID);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('extractCountryName', () => {
    test('given country geographyId then extracts name', () => {
      // When
      const result = extractCountryName(MOCK_GEOGRAPHY_IDS.COUNTRY_ENGLAND);

      // Then
      expect(result).toBe(EXPECTED_NAMES.COUNTRY_ENGLAND);
    });

    test('given country with underscore then replaces with space', () => {
      // When
      const result = extractCountryName(MOCK_GEOGRAPHY_IDS.COUNTRY_WITH_UNDERSCORE);

      // Then
      expect(result).toBe(EXPECTED_NAMES.COUNTRY_NI_WITH_SPACE);
    });

    test('given constituency geographyId then returns null', () => {
      // When
      const result = extractCountryName(MOCK_GEOGRAPHY_IDS.CONSTITUENCY_BRIGHTON);

      // Then
      expect(result).toBeNull();
    });

    test('given UK national then returns null', () => {
      // When
      const result = extractCountryName(MOCK_GEOGRAPHY_IDS.UK_NATIONAL);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getRegionKey', () => {
    test('given country geographyId then extracts region key', () => {
      // When
      const result = getRegionKey(MOCK_GEOGRAPHY_IDS.COUNTRY_ENGLAND);

      // Then
      expect(result).toBe(EXPECTED_REGION_KEYS.COUNTRY_ENGLAND);
    });

    test('given constituency geographyId then extracts constituency key', () => {
      // When
      const result = getRegionKey(MOCK_GEOGRAPHY_IDS.CONSTITUENCY_BRIGHTON);

      // Then
      expect(result).toBe(EXPECTED_REGION_KEYS.CONSTITUENCY_BRIGHTON);
    });

    test('given single-part ID then returns null', () => {
      // When
      const result = getRegionKey(MOCK_GEOGRAPHY_IDS.UK_NATIONAL);

      // Then
      expect(result).toBeNull();
    });

    test('given US state code then returns null', () => {
      // When
      const result = getRegionKey(MOCK_GEOGRAPHY_IDS.US_STATE);

      // Then
      expect(result).toBeNull();
    });
  });
});
