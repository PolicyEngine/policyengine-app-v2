import { describe, expect, test } from 'vitest';
import {
  buildSharePath,
  createShareDataFromReport,
  decodeShareData,
  encodeShareData,
  extractShareDataFromUrl,
  isValidShareData,
  ShareData,
} from '@/utils/shareUtils';

// Test fixtures
const VALID_SHARE_DATA: ShareData = {
  reportId: '308',
  countryId: 'us',
  year: '2024',
  simulationIds: ['sim-1', 'sim-2'],
  policyIds: ['policy-1', 'policy-2'],
  householdId: null,
  geographyId: 'us',
};

const VALID_HOUSEHOLD_SHARE_DATA: ShareData = {
  reportId: '309',
  countryId: 'uk',
  year: '2025',
  simulationIds: ['sim-3'],
  policyIds: ['policy-3'],
  householdId: 'household-123',
  geographyId: null,
};

describe('shareUtils', () => {
  describe('encodeShareData / decodeShareData', () => {
    test('given valid share data then encodes and decodes back to original', () => {
      // When
      const encoded = encodeShareData(VALID_SHARE_DATA);
      const decoded = decodeShareData(encoded);

      // Then
      expect(decoded).toEqual(VALID_SHARE_DATA);
    });

    test('given share data with householdId then round-trips correctly', () => {
      // When
      const encoded = encodeShareData(VALID_HOUSEHOLD_SHARE_DATA);
      const decoded = decodeShareData(encoded);

      // Then
      expect(decoded).toEqual(VALID_HOUSEHOLD_SHARE_DATA);
    });

    test('given encoded string then produces URL-safe characters', () => {
      // When
      const encoded = encodeShareData(VALID_SHARE_DATA);

      // Then - should not contain +, /, or = (standard base64 chars)
      expect(encoded).not.toMatch(/[+/=]/);
    });

    test('given invalid base64 string then returns null', () => {
      // When
      const result = decodeShareData('not-valid-base64!!!');

      // Then
      expect(result).toBeNull();
    });

    test('given valid base64 but invalid JSON then returns null', () => {
      // Given - "hello" in base64
      const invalidJson = btoa('hello').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      // When
      const result = decodeShareData(invalidJson);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('isValidShareData', () => {
    test('given valid share data then returns true', () => {
      // When
      const result = isValidShareData(VALID_SHARE_DATA);

      // Then
      expect(result).toBe(true);
    });

    test('given null then returns false', () => {
      // When
      const result = isValidShareData(null);

      // Then
      expect(result).toBe(false);
    });

    test('given object missing reportId then returns false', () => {
      // Given
      const invalid = { ...VALID_SHARE_DATA, reportId: undefined };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });

    test('given object with non-array simulationIds then returns false', () => {
      // Given
      const invalid = { ...VALID_SHARE_DATA, simulationIds: 'not-an-array' };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });

    test('given object with non-string array elements then returns false', () => {
      // Given
      const invalid = { ...VALID_SHARE_DATA, simulationIds: [123, 456] };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('buildSharePath', () => {
    test('given country and share data then builds correct path', () => {
      // When
      const path = buildSharePath('us', VALID_SHARE_DATA);

      // Then
      expect(path).toMatch(/^\/us\/report-output\/shared\?share=/);
    });

    test('given different country then uses that country in path', () => {
      // When
      const path = buildSharePath('uk', VALID_SHARE_DATA);

      // Then
      expect(path).toMatch(/^\/uk\/report-output\/shared\?share=/);
    });

    test('given share data then path contains decodable data', () => {
      // When
      const path = buildSharePath('us', VALID_SHARE_DATA);
      const shareParam = path.split('share=')[1];
      const decoded = decodeShareData(shareParam);

      // Then
      expect(decoded).toEqual(VALID_SHARE_DATA);
    });
  });

  describe('extractShareDataFromUrl', () => {
    test('given URL with valid share param then extracts share data', () => {
      // Given
      const encoded = encodeShareData(VALID_SHARE_DATA);
      const searchParams = new URLSearchParams(`share=${encoded}`);

      // When
      const result = extractShareDataFromUrl(searchParams);

      // Then
      expect(result).toEqual(VALID_SHARE_DATA);
    });

    test('given URL without share param then returns null', () => {
      // Given
      const searchParams = new URLSearchParams('other=value');

      // When
      const result = extractShareDataFromUrl(searchParams);

      // Then
      expect(result).toBeNull();
    });

    test('given URL with invalid share param then returns null', () => {
      // Given
      const searchParams = new URLSearchParams('share=invalid-data');

      // When
      const result = extractShareDataFromUrl(searchParams);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('createShareDataFromReport', () => {
    test('given society-wide report then creates share data with geographyId', () => {
      // Given
      const report = { id: '100', countryId: 'us', year: '2024', simulationIds: ['sim-1'] };
      const simulations = [{ id: 'sim-1', populationType: 'geography' as const }];
      const policies = [{ id: 'policy-1' }];
      const households: any[] = [];
      const geographies = [{ id: 'geo-1' }];

      // When
      const result = createShareDataFromReport(
        report as any,
        simulations as any,
        policies as any,
        households,
        geographies as any
      );

      // Then
      expect(result).toEqual({
        reportId: '100',
        countryId: 'us',
        year: '2024',
        simulationIds: ['sim-1'],
        policyIds: ['policy-1'],
        householdId: null,
        geographyId: 'geo-1',
      });
    });

    test('given household report then creates share data with householdId', () => {
      // Given
      const report = { id: '101', countryId: 'uk', year: '2025', simulationIds: ['sim-2'] };
      const simulations = [{ id: 'sim-2', populationType: 'household' as const }];
      const policies = [{ id: 'policy-2' }];
      const households = [{ id: 'hh-1' }];
      const geographies: any[] = [];

      // When
      const result = createShareDataFromReport(
        report as any,
        simulations as any,
        policies as any,
        households as any,
        geographies
      );

      // Then
      expect(result).toEqual({
        reportId: '101',
        countryId: 'uk',
        year: '2025',
        simulationIds: ['sim-2'],
        policyIds: ['policy-2'],
        householdId: 'hh-1',
        geographyId: null,
      });
    });

    test('given report without id then returns null', () => {
      // Given
      const report = { id: undefined, countryId: 'us', year: '2024', simulationIds: [] };

      // When
      const result = createShareDataFromReport(report as any, [], [], [], []);

      // Then
      expect(result).toBeNull();
    });
  });
});
