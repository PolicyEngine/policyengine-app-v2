import { describe, expect, it } from 'vitest';
import { getReportOutputPath } from '@/utils/reportRouting';
import { EXPECTED_PATHS, TEST_COUNTRY, TEST_REPORT_IDS } from '@/tests/fixtures/utils/reportRoutingMocks';

describe('reportRouting', () => {
  describe('getReportOutputPath', () => {
    it('given US country and numeric report ID then returns correct absolute path', () => {
      // When
      const result = getReportOutputPath(TEST_COUNTRY.US, TEST_REPORT_IDS.NUMERIC);

      // Then
      expect(result).toBe(EXPECTED_PATHS.US_NUMERIC);
    });

    it('given UK country and string report ID then returns correct absolute path', () => {
      // When
      const result = getReportOutputPath(TEST_COUNTRY.UK, TEST_REPORT_IDS.STRING);

      // Then
      expect(result).toBe(EXPECTED_PATHS.UK_STRING);
    });

    it('given report ID with special characters then preserves them in path', () => {
      // When
      const result = getReportOutputPath(TEST_COUNTRY.US, TEST_REPORT_IDS.WITH_SPECIAL_CHARS);

      // Then
      expect(result).toBe(EXPECTED_PATHS.US_SPECIAL_CHARS);
    });

    it('given path components then creates absolute path starting with slash', () => {
      // When
      const result = getReportOutputPath(TEST_COUNTRY.UK, TEST_REPORT_IDS.GENERIC);

      // Then
      expect(result.startsWith('/')).toBe(true);
    });
  });
});
