import { describe, expect, test } from 'vitest';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import { CURRENT_YEAR } from '@/constants';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserReportCreationPayload } from '@/types/payloads';

describe('UserReportAdapter', () => {
  // Test constants
  const TEST_USER_ID = 'user-123';
  const TEST_REPORT_ID = 'report-456';
  const TEST_LABEL = 'My Test Report';
  const TEST_TIMESTAMP = `${CURRENT_YEAR}-01-15T10:00:00Z`;

  describe('toCreationPayload', () => {
    test('given UserReport with all fields then creates proper payload', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: TEST_LABEL,
        updatedAt: TEST_TIMESTAMP,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      const expected: UserReportCreationPayload = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: TEST_LABEL,
        updatedAt: TEST_TIMESTAMP,
      };
      expect(result).toEqual(expected);
    });

    test('given UserReport without updatedAt then generates timestamp', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: TEST_LABEL,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.userId).toBe(TEST_USER_ID);
      expect(result.reportId).toBe(TEST_REPORT_ID);
      expect(result.label).toBe(TEST_LABEL);
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt as string).toISOString()).toBe(result.updatedAt);
    });

    test('given UserReport with numeric IDs then converts to strings', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: 123 as any,
        reportId: 456 as any,
        label: TEST_LABEL,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.userId).toBe('123');
      expect(result.reportId).toBe('456');
    });

    test('given UserReport without label then includes undefined label', () => {
      // Given
      const userReport: Omit<UserReport, 'id' | 'createdAt'> = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        isCreated: true,
      };

      // When
      const result = UserReportAdapter.toCreationPayload(userReport);

      // Then
      expect(result.label).toBeUndefined();
    });
  });

  describe('fromApiResponse', () => {
    test('given API response with all fields then creates UserReport', () => {
      // Given
      const apiData = {
        id: `ur-${TEST_REPORT_ID}`, // UserReport has its own ID
        reportId: TEST_REPORT_ID,
        userId: TEST_USER_ID,
        label: TEST_LABEL,
        createdAt: TEST_TIMESTAMP,
        updatedAt: TEST_TIMESTAMP,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      const expected: UserReport = {
        id: `ur-${TEST_REPORT_ID}`,
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: TEST_LABEL,
        createdAt: TEST_TIMESTAMP,
        updatedAt: TEST_TIMESTAMP,
        isCreated: true,
      };
      expect(result).toEqual(expected);
    });

    test('given API response without optional fields then creates UserReport with defaults', () => {
      // Given
      const apiData = {
        id: `ur-${TEST_REPORT_ID}`, // UserReport has its own ID
        reportId: TEST_REPORT_ID,
        userId: TEST_USER_ID,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(result.id).toBe(`ur-${TEST_REPORT_ID}`);
      expect(result.userId).toBe(TEST_USER_ID);
      expect(result.reportId).toBe(TEST_REPORT_ID);
      expect(result.label).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
      expect(result.isCreated).toBe(true);
    });

    test('given API response with null label then preserves null', () => {
      // Given
      const apiData = {
        id: `ur-${TEST_REPORT_ID}`, // UserReport has its own ID
        reportId: TEST_REPORT_ID,
        userId: TEST_USER_ID,
        label: null,
        createdAt: TEST_TIMESTAMP,
        updatedAt: TEST_TIMESTAMP,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then
      expect(result.label).toBeNull();
    });

    test('given API response with numeric IDs then preserves as numbers', () => {
      // Given
      const apiData = {
        id: 789, // UserReport's own numeric ID
        reportId: 123,
        userId: 456,
        label: TEST_LABEL,
      };

      // When
      const result = UserReportAdapter.fromApiResponse(apiData);

      // Then - adapter doesn't convert types, just passes through
      expect(result.id).toBe(789);
      expect(result.userId).toBe(456);
      expect(result.reportId).toBe(123);
    });
  });
});
