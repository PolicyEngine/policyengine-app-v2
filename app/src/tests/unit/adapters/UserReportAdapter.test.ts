import { describe, expect, test } from 'vitest';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import {
  mockUserReportApiResponse,
  mockUserReportCreationPayload,
  mockUserReportUS,
  mockUserReportWithoutOptionalFields,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_REPORT_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '@/tests/fixtures';
import { UserReport } from '@/types/ingredients/UserReport';

describe('UserReportAdapter', () => {
  describe('toCreationPayload', () => {
    test('given UserReport with all fields then creates proper payload', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_JKL,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_REPORT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result).toEqual(mockUserReportCreationPayload);
    });

    test('given UserReport without updatedAt then generates timestamp', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_JKL,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_REPORT,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.reportId).toBe(TEST_REPORT_IDS.REPORT_JKL);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBe(TEST_LABELS.MY_REPORT);
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt as string).toISOString()).toBe(result.updatedAt);
    });

    test('given UserReport with numeric IDs then converts to strings', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: 123 as any,
        reportId: 456 as any,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_REPORT,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.userId).toBe('123');
      expect(result.reportId).toBe('456');
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given UserReport without label then includes undefined label', () => {
      // Given
      const userReport = mockUserReportWithoutOptionalFields;

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.label).toBeUndefined();
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given UserReport with UK country then preserves country ID', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_MNO,
        countryId: TEST_COUNTRIES.UK,
        label: TEST_LABELS.MY_REPORT,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });
  });

  describe('fromApiResponse', () => {
    test('given API response with all fields then creates UserReport', () => {
      // Given
      const apiData = mockUserReportApiResponse;

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(result).toEqual(mockUserReportUS);
    });

    test('given API response without optional fields then creates UserReport with defaults', () => {
      // Given
      const apiData = {
        id: 'ur-report-jkl',
        reportId: TEST_REPORT_IDS.REPORT_JKL,
        userId: TEST_USER_IDS.USER_123,
        countryId: TEST_COUNTRIES.US,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(result.id).toBe('ur-report-jkl');
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.reportId).toBe(TEST_REPORT_IDS.REPORT_JKL);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
      expect(result.isCreated).toBe(true);
    });

    test('given API response with null label then preserves null', () => {
      // Given
      const apiData = {
        id: 'ur-report-jkl',
        reportId: TEST_REPORT_IDS.REPORT_JKL,
        userId: TEST_USER_IDS.USER_123,
        countryId: TEST_COUNTRIES.US,
        label: null,
        createdAt: TEST_TIMESTAMPS.CREATED_AT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(result.label).toBeNull();
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given API response with numeric IDs then preserves as numbers', () => {
      // Given
      const apiData = {
        id: 789, // UserReport's own numeric ID
        reportId: 123,
        userId: 456,
        countryId: TEST_COUNTRIES.UK,
        label: TEST_LABELS.MY_REPORT,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then - adapter doesn't convert types, just passes through
      expect(result.id).toBe(789);
      expect(result.userId).toBe(456);
      expect(result.reportId).toBe(123);
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });

    test('given API response with UK country then preserves country ID', () => {
      // Given
      const apiData = {
        ...mockUserReportApiResponse,
        countryId: TEST_COUNTRIES.UK,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });
  });
});
