import { describe, it, expect } from 'vitest';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import {
  mockUserReportInput,
  mockApiResponse,
  TEST_USER_IDS,
  TEST_REPORT_IDS,
  TEST_USER_REPORT_IDS,
  TEST_LABELS,
} from '@/tests/fixtures/adapters/UserReportAdapterMocks';

describe('UserReportAdapter', () => {
  describe('toCreationPayload', () => {
    it('given user report then converts to API payload', () => {
      // Given
      const userReport = mockUserReportInput();

      // When
      const payload = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(payload).toEqual({
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_456,
        label: TEST_LABELS.TEST_REPORT,
        updatedAt: '2025-01-15T12:00:00Z',
      });
    });

    it('given no updatedAt then uses current timestamp', () => {
      // Given
      const userReport = mockUserReportInput({ updatedAt: undefined });

      const beforeTime = new Date().toISOString();

      // When
      const payload = UserReportAdapter.toCreationPayload(userReport);

      const afterTime = new Date().toISOString();

      // Then
      expect(payload.updatedAt).toBeDefined();
      expect(payload.updatedAt!.length).toBeGreaterThan(0);
      // updatedAt should be between beforeTime and afterTime
      expect(payload.updatedAt! >= beforeTime).toBe(true);
      expect(payload.updatedAt! <= afterTime).toBe(true);
    });

    it('given numeric IDs then converts to strings', () => {
      // Given
      const userReport: any = {
        userId: 123,
        reportId: 456,
        label: 'Test',
        isCreated: true,
      };

      // When
      const payload = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(payload.userId).toBe('123');
      expect(payload.reportId).toBe('456');
      expect(typeof payload.userId).toBe('string');
      expect(typeof payload.reportId).toBe('string');
    });
  });

  describe('fromApiResponse', () => {
    it('given API response then converts to UserReport', () => {
      // Given
      const apiData = mockApiResponse();

      // When
      const userReport = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(userReport).toEqual({
        id: TEST_USER_REPORT_IDS.SUR_ABC123,
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_456,
        label: TEST_LABELS.TEST_REPORT,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T12:00:00Z',
        isCreated: true,
      });
    });

    it('given API response then always sets isCreated to true', () => {
      // Given
      const apiData = mockApiResponse({
        id: TEST_USER_REPORT_IDS.SUR_XYZ789,
        userId: TEST_USER_IDS.USER_456,
        reportId: TEST_REPORT_IDS.REPORT_789,
        label: TEST_LABELS.ANOTHER_REPORT,
      });

      // When
      const userReport = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(userReport.isCreated).toBe(true);
    });

    it('given missing updatedAt then includes undefined', () => {
      // Given
      const apiData = mockApiResponse({ updatedAt: undefined });

      // When
      const userReport = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(userReport.updatedAt).toBeUndefined();
    });
  });
});
