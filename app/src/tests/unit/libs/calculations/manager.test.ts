import { describe, test, expect, beforeEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { CalculationManager } from '@/libs/calculations/manager';
import * as service from '@/libs/calculations/service';
import * as progressUpdaterModule from '@/libs/calculations/progressUpdater';
import * as reportApi from '@/api/report';
import {
  TEST_REPORT_ID,
  HOUSEHOLD_BUILD_PARAMS,
  HOUSEHOLD_META,
  ECONOMY_META,
  OK_STATUS_HOUSEHOLD,
  OK_STATUS_ECONOMY,
  ERROR_STATUS,
  COMPUTING_STATUS,
} from '@/tests/fixtures/libs/calculations/serviceMocks';
import { createMockHouseholdHandler } from '@/tests/fixtures/libs/calculations/handlerMocks';

// Mock modules
vi.mock('@/libs/calculations/service');
vi.mock('@/libs/calculations/progressUpdater');
vi.mock('@/api/report');

describe('CalculationManager', () => {
  let queryClient: QueryClient;
  let manager: CalculationManager;
  let mockService: jest.Mocked<service.CalculationService>;
  let mockProgressUpdater: jest.Mocked<progressUpdaterModule.HouseholdProgressUpdater>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.invalidateQueries = vi.fn();

    // Create mock service
    mockService = {
      buildMetadata: vi.fn().mockReturnValue(HOUSEHOLD_META),
      getQueryOptions: vi.fn().mockReturnValue({
        queryKey: ['calculation', TEST_REPORT_ID],
        queryFn: vi.fn(),
      }),
      executeCalculation: vi.fn().mockResolvedValue(OK_STATUS_HOUSEHOLD),
      getHandler: vi.fn().mockReturnValue(createMockHouseholdHandler()),
      getStatus: vi.fn().mockReturnValue(null),
    };
    vi.mocked(service.getCalculationService).mockReturnValue(mockService);

    // Create mock progress updater
    mockProgressUpdater = {
      startProgressUpdates: vi.fn(),
      stopProgressUpdates: vi.fn(),
      stopAllUpdates: vi.fn(),
    };
    vi.mocked(progressUpdaterModule.HouseholdProgressUpdater).mockImplementation(
      () => mockProgressUpdater as any
    );

    manager = new CalculationManager(queryClient);
  });

  describe('buildMetadata', () => {
    test('given build params then delegates to service', () => {
      // When
      const result = manager.buildMetadata(HOUSEHOLD_BUILD_PARAMS);

      // Then
      expect(result).toBe(HOUSEHOLD_META);
      expect(mockService.buildMetadata).toHaveBeenCalledWith(HOUSEHOLD_BUILD_PARAMS);
    });
  });

  describe('getQueryOptions', () => {
    test('given report and metadata then delegates to service', () => {
      // Given
      const expectedOptions = {
        queryKey: ['calculation', TEST_REPORT_ID],
        queryFn: vi.fn(),
      };
      mockService.getQueryOptions.mockReturnValue(expectedOptions);

      // When
      const result = manager.getQueryOptions(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(result).toBe(expectedOptions);
      expect(mockService.getQueryOptions).toHaveBeenCalledWith(TEST_REPORT_ID, HOUSEHOLD_META);
    });
  });

  describe('fetchCalculation', () => {
    test('given successful household calculation then updates report status', async () => {
      // Given
      mockService.executeCalculation.mockImplementation(async (reportId: any, meta: any, onComplete: any) => {
        // Simulate the callback being invoked for household calculations
        if (meta.type === 'household' && onComplete) {
          await onComplete(reportId, 'ok', OK_STATUS_HOUSEHOLD.result);
        }
        return OK_STATUS_HOUSEHOLD;
      });

      // When
      const result = await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(result).toBe(OK_STATUS_HOUSEHOLD);
      expect(reportApi.markReportCompleted).toHaveBeenCalledWith(
        HOUSEHOLD_META.countryId,
        TEST_REPORT_ID,
        expect.objectContaining({
          reportId: TEST_REPORT_ID,
          status: 'complete',
          output: OK_STATUS_HOUSEHOLD.result,
        })
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', TEST_REPORT_ID],
      });
    });

    test('given failed calculation then marks report as error', async () => {
      // Given
      mockService.executeCalculation.mockImplementation(async (reportId: any, meta: any, onComplete: any) => {
        // Simulate the callback being invoked for household calculations
        if (meta.type === 'household' && onComplete) {
          await onComplete(reportId, 'error', undefined);
        }
        return ERROR_STATUS;
      });

      // When
      const result = await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(result).toBe(ERROR_STATUS);
      expect(reportApi.markReportError).toHaveBeenCalledWith(
        HOUSEHOLD_META.countryId,
        TEST_REPORT_ID,
        expect.objectContaining({
          reportId: TEST_REPORT_ID,
          status: 'error',
          output: null,
        })
      );
    });

    test('given computing status then does not update report', async () => {
      // Given
      mockService.executeCalculation.mockResolvedValue(COMPUTING_STATUS);

      // When
      const result = await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(result).toBe(COMPUTING_STATUS);
      expect(reportApi.markReportCompleted).not.toHaveBeenCalled();
      expect(reportApi.markReportError).not.toHaveBeenCalled();
    });

    test('given already updated report then skips duplicate update', async () => {
      // Given
      mockService.executeCalculation.mockImplementation(async (reportId: any, meta: any, onComplete: any) => {
        // Simulate the callback being invoked for household calculations
        if (meta.type === 'household' && onComplete) {
          await onComplete(reportId, 'ok', OK_STATUS_HOUSEHOLD.result);
        }
        return OK_STATUS_HOUSEHOLD;
      });

      // First call
      await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);
      vi.clearAllMocks();

      // When - second call
      await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then - no second update
      expect(reportApi.markReportCompleted).not.toHaveBeenCalled();
    });

    test('given report update failure then retries once', async () => {
      // Given
      vi.useFakeTimers();
      mockService.executeCalculation.mockImplementation(async (reportId: any, meta: any, onComplete: any) => {
        // Simulate the callback being invoked for household calculations
        if (meta.type === 'household' && onComplete) {
          await onComplete(reportId, 'ok', OK_STATUS_HOUSEHOLD.result);
        }
        return OK_STATUS_HOUSEHOLD;
      });
      vi.mocked(reportApi.markReportCompleted)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined as any);

      // When
      const promise = manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Wait for initial call to complete
      await vi.runAllTimersAsync();
      await promise;

      // Then
      expect(reportApi.markReportCompleted).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe('startCalculation', () => {
    test('given household calculation then starts progress updates', async () => {
      // Given
      const mockHandler = createMockHouseholdHandler();
      mockHandler.isActive.mockReturnValue(false);
      mockService.getHandler.mockReturnValue(mockHandler);

      // When
      await manager.startCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(mockService.executeCalculation).toHaveBeenCalledWith(
        TEST_REPORT_ID,
        HOUSEHOLD_META,
        expect.any(Function) // The callback function
      );
      expect(mockProgressUpdater.startProgressUpdates).toHaveBeenCalledWith(
        TEST_REPORT_ID,
        mockHandler
      );
    });

    test('given already active household calculation then skips start', async () => {
      // Given
      const mockHandler = createMockHouseholdHandler();
      mockHandler.isActive.mockReturnValue(true);
      mockService.getHandler.mockReturnValue(mockHandler);

      // When
      await manager.startCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(mockService.executeCalculation).not.toHaveBeenCalled();
      expect(mockProgressUpdater.startProgressUpdates).not.toHaveBeenCalled();
    });

    test('given economy calculation then does not start progress updates', async () => {
      // When
      await manager.startCalculation(TEST_REPORT_ID, ECONOMY_META);

      // Then
      expect(mockProgressUpdater.startProgressUpdates).not.toHaveBeenCalled();
    });

    test('given new calculation then resets report tracking', async () => {
      // Given
      mockService.executeCalculation.mockImplementation(async (reportId: any, meta: any, onComplete: any) => {
        // Simulate the callback being invoked for household calculations
        if (meta.type === 'household' && onComplete) {
          await onComplete(reportId, 'ok', OK_STATUS_HOUSEHOLD.result);
        }
        return OK_STATUS_HOUSEHOLD;
      });
      const mockHandler = createMockHouseholdHandler();
      mockHandler.isActive.mockReturnValue(false);
      mockService.getHandler.mockReturnValue(mockHandler);

      // First calculation and update
      await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);
      vi.clearAllMocks();

      // When - start new calculation (resets tracking)
      await manager.startCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then - fetchCalculation should update report again
      await manager.fetchCalculation(TEST_REPORT_ID, HOUSEHOLD_META);
      expect(reportApi.markReportCompleted).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStatus', () => {
    test('given household type then delegates to service', () => {
      // Given
      mockService.getStatus.mockReturnValue(COMPUTING_STATUS);

      // When
      const result = manager.getStatus(TEST_REPORT_ID, 'household');

      // Then
      expect(result).toBe(COMPUTING_STATUS);
      expect(mockService.getStatus).toHaveBeenCalledWith(TEST_REPORT_ID, 'household');
    });

    test('given economy type then delegates to service', () => {
      // When
      const result = manager.getStatus(TEST_REPORT_ID, 'economy');

      // Then
      expect(result).toBeNull();
      expect(mockService.getStatus).toHaveBeenCalledWith(TEST_REPORT_ID, 'economy');
    });
  });

  describe('getCacheKey', () => {
    test('given report ID then returns standard cache key', () => {
      // When
      const result = manager.getCacheKey(TEST_REPORT_ID);

      // Then
      expect(result).toEqual(['calculation', TEST_REPORT_ID]);
    });
  });

  describe('updateReportStatus', () => {
    test('given successful update then invalidates cache', async () => {
      // When
      await manager.updateReportStatus(
        TEST_REPORT_ID,
        'complete',
        'us',
        OK_STATUS_HOUSEHOLD.result
      );

      // Then
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', TEST_REPORT_ID],
      });
    });

    test('given failed update with retry success then still invalidates cache', async () => {
      // Given
      vi.useFakeTimers();
      vi.mocked(reportApi.markReportCompleted)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined as any);

      // When
      const promise = manager.updateReportStatus(
        TEST_REPORT_ID,
        'complete',
        'us',
        OK_STATUS_HOUSEHOLD.result
      );

      // Advance time for retry
      await vi.runAllTimersAsync();
      await promise;

      // Then
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', TEST_REPORT_ID],
      });
      vi.useRealTimers();
    });

    test('given failed update with retry failure then logs error', async () => {
      // Given
      vi.useFakeTimers();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(reportApi.markReportCompleted)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Still failing'));

      // When
      const promise = manager.updateReportStatus(
        TEST_REPORT_ID,
        'complete',
        'us',
        OK_STATUS_HOUSEHOLD.result
      );

      // Advance time for retry
      await vi.runAllTimersAsync();
      await promise;

      // Then
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update report'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});