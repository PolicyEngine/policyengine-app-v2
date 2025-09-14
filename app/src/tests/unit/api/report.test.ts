import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createReport, fetchReportById, markReportCompleted, markReportError } from '@/api/report';
import { BASE_URL } from '@/constants';
import {
  mockCompletedReportPayload,
  mockErrorReport,
  mockErrorReportPayload,
  mockReport,
  mockReportCreationPayload,
  mockReportMetadata,
} from '@/tests/fixtures/adapters/reportMocks';

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

  describe('createReport', () => {
    test('given valid payload then creates report successfully', async () => {
      // Given
      const countryId = 'us';
      const payload = mockReportCreationPayload;
      const mockApiResponse = { result: mockReportMetadata };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await createReport(countryId, payload);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${countryId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(mockReportMetadata);
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
      await expect(createReport(countryId, payload)).rejects.toThrow('Failed to create report');
    });
  });

  describe('markReportCompleted', () => {
    test('given valid output then marks report as completed successfully', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const mockApiResponse = { result: mockReportMetadata };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await markReportCompleted(countryId, reportId, mockReport);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${countryId}/report`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockCompletedReportPayload),
      });
      expect(result).toEqual(mockReportMetadata);
    });

    test('given API error then throws error', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When & Then
      await expect(markReportCompleted(countryId, reportId, mockReport)).rejects.toThrow(
        'Failed to update report report-123'
      );
    });
  });

  describe('markReportError', () => {
    test('given valid report ID then marks report as error successfully', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const mockApiResponse = { result: mockReportMetadata };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await markReportError(countryId, reportId, mockErrorReport);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${countryId}/report`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockErrorReportPayload),
      });
      expect(result).toEqual(mockReportMetadata);
    });

    test('given API error then throws error', async () => {
      // Given
      const countryId = 'us';
      const reportId = 'report-123';
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When & Then
      await expect(markReportError(countryId, reportId, mockErrorReport)).rejects.toThrow(
        'Failed to update report report-123'
      );
    });
  });
});
