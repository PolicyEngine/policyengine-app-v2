import { describe, test, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { HouseholdProgressUpdater } from '@/libs/calculations/progressUpdater';
import { HouseholdCalculationHandler } from '@/libs/calculations/handlers/household';
import {
  TEST_REPORT_ID,
  MOCK_HOUSEHOLD_RESULT,
  advanceTimeAndFlush,
} from '@/tests/fixtures/libs/calculations/handlerMocks';
import {
  COMPUTING_STATUS,
  OK_STATUS_HOUSEHOLD,
  ERROR_STATUS,
} from '@/tests/fixtures/libs/calculations/serviceMocks';

describe('HouseholdProgressUpdater', () => {
  let queryClient: QueryClient;
  let updater: HouseholdProgressUpdater;
  let mockHandler: jest.Mocked<Partial<HouseholdCalculationHandler>>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Create mock query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData = vi.fn();

    // Create mock handler
    mockHandler = {
      getStatus: vi.fn(),
    };

    updater = new HouseholdProgressUpdater(queryClient);
  });

  afterEach(() => {
    updater.stopAllUpdates();
    vi.useRealTimers();
  });

  describe('startProgressUpdates', () => {
    test('given calculation in progress then updates cache every 500ms', async () => {
      // Given
      mockHandler.getStatus?.mockReturnValue(COMPUTING_STATUS);

      // When
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);

      // Advance time by 1500ms (3 intervals)
      await advanceTimeAndFlush(1500);

      // Then
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(3);
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['calculation', TEST_REPORT_ID],
        COMPUTING_STATUS
      );
    });

    test('given completed calculation then stops updates', async () => {
      // Given
      mockHandler.getStatus
        ?.mockReturnValueOnce(COMPUTING_STATUS)
        .mockReturnValueOnce(COMPUTING_STATUS)
        .mockReturnValueOnce(OK_STATUS_HOUSEHOLD);

      // When
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);

      // Advance time by 1500ms (3 intervals)
      await advanceTimeAndFlush(1500);

      // Then - should update 3 times then stop
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(3);

      // Advance more time
      await advanceTimeAndFlush(1000);

      // Should not have more updates
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(3);
    });

    test('given error status then stops updates', async () => {
      // Given
      mockHandler.getStatus
        ?.mockReturnValueOnce(COMPUTING_STATUS)
        .mockReturnValueOnce(ERROR_STATUS);

      // When
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);

      // Advance time
      await advanceTimeAndFlush(1000);

      // Then - should update twice then stop
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(2);
      expect(queryClient.setQueryData).toHaveBeenLastCalledWith(
        ['calculation', TEST_REPORT_ID],
        ERROR_STATUS
      );
    });

    test('given null status then stops updates', async () => {
      // Given
      mockHandler.getStatus
        ?.mockReturnValueOnce(COMPUTING_STATUS)
        .mockReturnValueOnce(null);

      // When
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);

      // Advance time
      await advanceTimeAndFlush(1000);

      // Then - should update once then stop
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(1);
    });

    test('given duplicate start request then ignores second request', () => {
      // Given
      mockHandler.getStatus?.mockReturnValue(COMPUTING_STATUS);

      // When
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);

      // Then
      expect(mockHandler.getStatus).toHaveBeenCalledTimes(0); // Not called immediately
    });

    test('given different report IDs then tracks both independently', async () => {
      // Given
      const reportId2 = 'report-456';
      const mockHandler2 = {
        getStatus: vi.fn().mockReturnValue(COMPUTING_STATUS),
      };

      // When
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);
      updater.startProgressUpdates(reportId2, mockHandler2 as any);

      // Advance time
      await advanceTimeAndFlush(500);

      // Then
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['calculation', TEST_REPORT_ID],
        COMPUTING_STATUS
      );
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['calculation', reportId2],
        COMPUTING_STATUS
      );
    });
  });

  describe('stopProgressUpdates', () => {
    test('given active updates then stops them', async () => {
      // Given
      mockHandler.getStatus?.mockReturnValue(COMPUTING_STATUS);
      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);

      // Verify updates are happening
      await advanceTimeAndFlush(500);
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(1);

      // When
      updater.stopProgressUpdates(TEST_REPORT_ID);

      // Advance more time
      await advanceTimeAndFlush(1000);

      // Then - no more updates
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(1);
    });

    test('given non-existent report ID then does nothing', () => {
      // When/Then - should not throw
      expect(() => updater.stopProgressUpdates('non-existent')).not.toThrow();
    });
  });

  describe('stopAllUpdates', () => {
    test('given multiple active updates then stops all', async () => {
      // Given
      const reportId2 = 'report-456';
      const mockHandler2 = {
        getStatus: vi.fn().mockReturnValue(COMPUTING_STATUS),
      };
      mockHandler.getStatus?.mockReturnValue(COMPUTING_STATUS);

      updater.startProgressUpdates(TEST_REPORT_ID, mockHandler as any);
      updater.startProgressUpdates(reportId2, mockHandler2 as any);

      // Verify both are updating
      await advanceTimeAndFlush(500);
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(2);

      // When
      updater.stopAllUpdates();

      // Advance more time
      await advanceTimeAndFlush(1000);

      // Then - no more updates
      expect(queryClient.setQueryData).toHaveBeenCalledTimes(2);
    });

    test('given no active updates then does nothing', () => {
      // When/Then - should not throw
      expect(() => updater.stopAllUpdates()).not.toThrow();
    });
  });
});