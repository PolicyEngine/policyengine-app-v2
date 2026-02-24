import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchReportById } from '@/api/report';
import { BASE_URL } from '@/constants';
import { mockReportMetadata } from '@/tests/fixtures/adapters/reportMocks';

// Mock fetch globally
global.fetch = vi.fn();

describe('report API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchReportById', () => {
    test('given valid country and report ID then fetches report successfully', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ result: mockReportMetadata }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchReportById(countryId, reportId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${countryId}/report/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      expect(result).toEqual(mockReportMetadata);
    });

    test('given API error then throws error', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When & Then
      await expect(fetchReportById(countryId, reportId)).rejects.toThrow(
        'Failed to fetch report report-123'
      );
    });
  });
});
