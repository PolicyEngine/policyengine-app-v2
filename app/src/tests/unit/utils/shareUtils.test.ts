import { describe, expect, test } from 'vitest';
import {
  buildSharePath,
  createShareData,
  decodeShareData,
  encodeShareData,
  extractShareDataFromUrl,
  getShareDataUserReportId,
  isValidShareData,
  ShareData,
} from '@/utils/shareUtils';

// Test fixtures using Omit<> types (include all fields except userId/timestamps)
const VALID_SHARE_DATA: ShareData = {
  userReport: {
    id: 'sur-abc123',
    reportId: '308',
    countryId: 'us',
    label: 'My Report',
  },
  userSimulations: [
    { simulationId: 'sim-1', countryId: 'us', label: 'Baseline' },
    { simulationId: 'sim-2', countryId: 'us', label: 'Reform' },
  ],
  userPolicies: [
    { policyId: 'policy-1', countryId: 'us', label: 'Current Law' },
    { policyId: 'policy-2', countryId: 'us', label: 'My Policy' },
  ],
  userHouseholds: [],
  userGeographies: [
    {
      type: 'geography',
      geographyId: 'us',
      countryId: 'us',
      scope: 'national',
      label: 'United States',
    },
  ],
};

const VALID_HOUSEHOLD_SHARE_DATA: ShareData = {
  userReport: {
    id: 'sur-def456',
    reportId: '309',
    countryId: 'uk',
    label: 'Household Report',
  },
  userSimulations: [{ simulationId: 'sim-3', countryId: 'uk', label: 'My Simulation' }],
  userPolicies: [{ policyId: 'policy-3', countryId: 'uk', label: 'My Policy' }],
  userHouseholds: [
    { type: 'household', householdId: 'household-123', countryId: 'uk', label: 'My Household' },
  ],
  userGeographies: [],
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

      // Then - should not contain +, /, or = (standard base64 chars that need URL encoding)
      expect(encoded).not.toMatch(/[+/=]/);
      // Should only contain URL-safe base64 characters
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    test('given encoded string then can be used in URL without breaking', () => {
      // When
      const encoded = encodeShareData(VALID_SHARE_DATA);

      // Then - verify round-trip through URL: encode -> put in URL -> extract -> decode
      const url = new URL(`https://example.com/report?share=${encoded}`);
      const extractedParam = url.searchParams.get('share');
      const decoded = decodeShareData(extractedParam!);

      expect(decoded).toEqual(VALID_SHARE_DATA);
    });

    test('given invalid base64 string then returns null', () => {
      // When
      const result = decodeShareData('not-valid-base64!!!');

      // Then
      expect(result).toBeNull();
    });

    test('given valid base64 but invalid JSON structure then returns null', () => {
      // Given - encode a non-ShareData object
      const invalidShareData = btoa(JSON.stringify({ foo: 'bar' }));

      // When
      const result = decodeShareData(invalidShareData);

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

    test('given object missing userReport then returns false', () => {
      // Given
      const invalid = { ...VALID_SHARE_DATA, userReport: undefined };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });

    test('given object with non-array userSimulations then returns false', () => {
      // Given
      const invalid = { ...VALID_SHARE_DATA, userSimulations: 'not-an-array' };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });

    test('given object with invalid userSimulation objects then returns false', () => {
      // Given - simulationId should be string, not number
      const invalid = {
        ...VALID_SHARE_DATA,
        userSimulations: [{ simulationId: 123, countryId: 'us' }],
      };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });

    test('given object with invalid countryId then returns false', () => {
      // Given
      const invalid = {
        ...VALID_SHARE_DATA,
        userReport: { ...VALID_SHARE_DATA.userReport, countryId: 'invalid' },
      };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });

    test('given object with invalid geography scope then returns false', () => {
      // Given
      const invalid = {
        ...VALID_SHARE_DATA,
        userGeographies: [{ geographyId: 'us', countryId: 'us', scope: 'invalid' }],
      };

      // When
      const result = isValidShareData(invalid);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('buildSharePath', () => {
    test('given share data then builds correct path with userReportId', () => {
      // When
      const path = buildSharePath(VALID_SHARE_DATA);

      // Then - should use userReport.id in path
      expect(path).toMatch(/^\/us\/report-output\/sur-abc123\?share=/);
    });

    test('given share data with different country then uses that country in path', () => {
      // When
      const path = buildSharePath(VALID_HOUSEHOLD_SHARE_DATA);

      // Then
      expect(path).toMatch(/^\/uk\/report-output\/sur-def456\?share=/);
    });

    test('given share data then path contains decodable data', () => {
      // When
      const path = buildSharePath(VALID_SHARE_DATA);
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

  describe('createShareData', () => {
    test('given user associations then creates share data', () => {
      // Given
      const userReport = {
        id: 'sur-test1',
        userId: 'anonymous',
        reportId: '100',
        countryId: 'us' as const,
        label: 'My Report',
      };
      const userSimulations = [
        {
          userId: 'anonymous',
          simulationId: 'sim-1',
          countryId: 'us' as const,
          label: 'Sim Label',
        },
      ];
      const userPolicies = [
        {
          userId: 'anonymous',
          policyId: 'policy-1',
          countryId: 'us' as const,
          label: 'Policy Label',
        },
      ];
      const userGeographies = [
        {
          type: 'geography' as const,
          userId: 'anonymous',
          geographyId: 'geo-1',
          countryId: 'us' as const,
          scope: 'national' as const,
          label: 'Geography Label',
        },
      ];

      // When
      const result = createShareData(
        userReport,
        userSimulations,
        userPolicies,
        [],
        userGeographies
      );

      // Then - result should have all fields except userId/timestamps
      expect(result).toMatchObject({
        userReport: {
          id: 'sur-test1',
          reportId: '100',
          countryId: 'us',
          label: 'My Report',
        },
        userSimulations: [{ simulationId: 'sim-1', countryId: 'us', label: 'Sim Label' }],
        userPolicies: [{ policyId: 'policy-1', countryId: 'us', label: 'Policy Label' }],
        userHouseholds: [],
        userGeographies: [
          {
            type: 'geography',
            geographyId: 'geo-1',
            countryId: 'us',
            scope: 'national',
            label: 'Geography Label',
          },
        ],
      });
      // Verify userId was stripped
      expect(result?.userReport).not.toHaveProperty('userId');
      expect(result?.userSimulations[0]).not.toHaveProperty('userId');
    });

    test('given user report without id then returns null', () => {
      // Given
      const userReport = {
        id: undefined as unknown as string,
        userId: 'anonymous',
        reportId: '100',
        countryId: 'us' as const,
      };

      // When
      const result = createShareData(userReport, [], [], [], []);

      // Then
      expect(result).toBeNull();
    });

    test('given user report without reportId then returns null', () => {
      // Given
      const userReport = {
        id: 'sur-test',
        userId: 'anonymous',
        reportId: undefined as unknown as string,
        countryId: 'us' as const,
      };

      // When
      const result = createShareData(userReport, [], [], [], []);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getShareDataUserReportId', () => {
    test('given share data with id then returns id', () => {
      // When
      const result = getShareDataUserReportId(VALID_SHARE_DATA);

      // Then
      expect(result).toBe('sur-abc123');
    });

    test('given share data without id then falls back to reportId', () => {
      // Given - simulate legacy data without id field
      const shareData = {
        ...VALID_SHARE_DATA,
        userReport: {
          ...VALID_SHARE_DATA.userReport,
          id: undefined,
        },
      } as unknown as ShareData;

      // When
      const result = getShareDataUserReportId(shareData);

      // Then
      expect(result).toBe('308'); // Falls back to reportId
    });
  });
});
