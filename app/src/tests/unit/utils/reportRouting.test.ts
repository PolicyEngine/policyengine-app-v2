import { describe, expect, it } from 'vitest';
import { getReportOutputPath } from '@/utils/reportRouting';

describe('reportRouting', () => {
  describe('getReportOutputPath', () => {
    it('given US country and numeric report ID then returns correct absolute path', () => {
      // Given
      const countryId = 'us';
      const reportId = 12345;

      // When
      const result = getReportOutputPath(countryId, reportId);

      // Then
      expect(result).toBe('/us/report-output/12345');
    });

    it('given UK country and string report ID then returns correct absolute path', () => {
      // Given
      const countryId = 'uk';
      const reportId = 'report-abc-123';

      // When
      const result = getReportOutputPath(countryId, reportId);

      // Then
      expect(result).toBe('/uk/report-output/report-abc-123');
    });

    it('given report ID with special characters then preserves them in path', () => {
      // Given
      const countryId = 'us';
      const reportId = 'report_id-123';

      // When
      const result = getReportOutputPath(countryId, reportId);

      // Then
      expect(result).toBe('/us/report-output/report_id-123');
    });

    it('given path components then creates absolute path starting with slash', () => {
      // Given
      const countryId = 'uk';
      const reportId = '999';

      // When
      const result = getReportOutputPath(countryId, reportId);

      // Then
      expect(result.startsWith('/')).toBe(true);
    });
  });
});
