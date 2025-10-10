import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createReport,
  createReportAndAssociateWithUser,
  fetchReportById,
  markReportCompleted,
  markReportError,
} from '@/api/report';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import { BASE_URL, MOCK_USER_ID } from '@/constants';
import {
  mockCompletedReportPayload,
  mockErrorReport,
  mockErrorReportPayload,
  mockReport,
  mockReportCreationPayload,
  mockReportMetadata,
} from '@/tests/fixtures/adapters/reportMocks';
import {
  createMockReportWithAssociationResult,
  createMockUserReport,
  MOCK_USER_LABEL,
} from '@/tests/fixtures/api/reportMocks';

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

  describe('createReportAndAssociateWithUser', () => {
    test('given valid params then creates report and association', async () => {
      // Given
      const countryId = 'us';
      const payload = mockReportCreationPayload;
      const userId = MOCK_USER_ID;
      const label = MOCK_USER_LABEL;

      const mockApiResponse = { result: mockReportMetadata };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Mock localStorage
      const mockUserReport = createMockUserReport(String(mockReportMetadata.id), userId, label);

      const createSpy = vi.spyOn(LocalStorageReportStore.prototype, 'create');
      createSpy.mockResolvedValue(mockUserReport);

      // When
      const result = await createReportAndAssociateWithUser({
        countryId,
        payload,
        userId,
        label,
      });

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${countryId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(createSpy).toHaveBeenCalledWith({
        userId,
        reportId: String(mockReportMetadata.id),
        label,
        isCreated: true,
      });

      const expectedResult = createMockReportWithAssociationResult(
        mockReportMetadata,
        userId,
        label
      );
      expect(result).toEqual(expectedResult);

      createSpy.mockRestore();
    });

    test('given API error then throws error', async () => {
      // Given
      const countryId = 'us';
      const payload = mockReportCreationPayload;
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When & Then
      await expect(
        createReportAndAssociateWithUser({
          countryId,
          payload,
          userId: MOCK_USER_ID,
          label: 'Test',
        })
      ).rejects.toThrow('Failed to create report');
    });

    test('given association error then throws error', async () => {
      // Given
      const countryId = 'us';
      const payload = mockReportCreationPayload;
      const mockApiResponse = { result: mockReportMetadata };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const createSpy = vi.spyOn(LocalStorageReportStore.prototype, 'create');
      createSpy.mockRejectedValue(new Error('Failed to create association'));

      // When & Then
      await expect(
        createReportAndAssociateWithUser({
          countryId,
          payload,
          userId: MOCK_USER_ID,
          label: 'Test',
        })
      ).rejects.toThrow('Failed to create association');

      createSpy.mockRestore();
    });
  });
});
