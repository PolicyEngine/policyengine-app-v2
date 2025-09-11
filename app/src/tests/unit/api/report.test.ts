import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fetchReportById, createReport, updateReport } from '@/api/report';
import {
  mockReportMetadata,
  mockReportCreationPayload,
  mockCompletedReportPayload,
} from '@/tests/fixtures/adapters/reportMocks';
import { BASE_URL } from '@/constants';

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
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/report-output/${reportId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      expect(result).toEqual({
        ...mockReportMetadata,
        id: String(mockReportMetadata.id),
      });
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

  describe('createReport', () => {
    test('given valid payload then creates report successfully', async () => {
      // Given
      const countryId = 'us';
      const payload = mockReportCreationPayload;
      const mockApiResponse = { result: { id: 123 } };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await createReport(countryId, payload);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/report-output`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      expect(result).toEqual({ result: { id: '123' } });
    });

    test('given API error then throws error', async () => {
      // Given
      const countryId = 'us';
      const payload = mockReportCreationPayload;
      const mockResponse = {
        ok: false,
        status: 400,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When & Then
      await expect(createReport(countryId, payload)).rejects.toThrow(
        'Failed to create report'
      );
    });
  });

  describe('updateReport', () => {
    test('given valid payload then updates report successfully', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const payload = mockCompletedReportPayload;
      const mockApiResponse = { result: mockReportMetadata };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await updateReport(countryId, reportId, payload);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/report-output/${reportId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      expect(result).toEqual({
        result: {
          ...mockReportMetadata,
          id: String(mockReportMetadata.id),
        },
      });
    });

    test('given API error then throws error', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const payload = mockCompletedReportPayload;
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When & Then
      await expect(updateReport(countryId, reportId, payload)).rejects.toThrow(
        'Failed to update report report-123'
      );
    });
  });
});