import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { markReportCompleted, markReportError } from '@/api/report';
import {
  CalculationManager,
  getCalculationManager,
  resetCalculationManager,
} from '@/libs/calculations/manager';
import {
  EXISTING_REPORT_ID,
  MOCK_ECONOMY_RESULT,
  MOCK_HOUSEHOLD_RESULT,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/reportMocks';
import {
  createMockHandlers,
  createMockManagerQueryClient,
  INVALID_TYPE_META,
  MANAGER_COMPUTING_STATUS,
  MANAGER_ECONOMY_META,
  MANAGER_ERROR_MESSAGES,
  MANAGER_HOUSEHOLD_META,
  MANAGER_OK_STATUS,
  MANAGER_TEST_REPORT_ID,
} from '@/tests/fixtures/libs/calculations/managerMocks';

// Mock the report API module
vi.mock('@/api/report', () => ({
  markReportCompleted: vi.fn(),
  markReportError: vi.fn(),
}));

// Mock the handler modules
vi.mock('@/libs/calculations/handlers', () => ({
  CalculationHandler: vi.fn(),
  HouseholdCalculationHandler: vi.fn().mockImplementation(() => ({
    fetch: vi.fn(),
    getStatus: vi.fn(),
    startCalculation: vi.fn(),
    getCacheKey: (reportId: string) => ['calculation', reportId] as const,
  })),
  EconomyCalculationHandler: vi.fn().mockImplementation(() => ({
    fetch: vi.fn(),
    getStatus: vi.fn(),
    startCalculation: vi.fn(),
    getCacheKey: (reportId: string) => ['calculation', reportId] as const,
  })),
}));

describe('CalculationManager', () => {
  let queryClient: ReturnType<typeof createMockManagerQueryClient>;

  beforeEach(() => {
    queryClient = createMockManagerQueryClient();
    resetCalculationManager(); // Reset singleton before each test
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor and getHandler', () => {
    test('given valid query client then creates manager with handlers', () => {
      // Given/When
      const manager = new CalculationManager(queryClient);

      // Then
      expect(manager).toBeDefined();
      expect(manager.getHandler('household')).toBeDefined();
      expect(manager.getHandler('economy')).toBeDefined();
    });

    test('given household type then returns household handler', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When
      const handler = manager.getHandler('household');

      // Then
      expect(handler).toBeDefined();
      // Since we're mocking, just check it exists
      expect(handler).toBeTruthy();
    });

    test('given economy type then returns economy handler', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When
      const handler = manager.getHandler('economy');

      // Then
      expect(handler).toBeDefined();
      // Since we're mocking, just check it exists
      expect(handler).toBeTruthy();
    });

    test('given invalid type then throws error', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When/Then
      expect(() => manager.getHandler('invalid' as any)).toThrow(
        MANAGER_ERROR_MESSAGES.NO_HANDLER('invalid')
      );
    });
  });

  describe('fetchCalculation', () => {
    test('given household metadata then delegates to household handler', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.household.fetchMock.mockResolvedValue(MANAGER_OK_STATUS);

      // Replace the real handler with mock
      (manager as any).handlers.set('household', mockHandlers.household);

      // When
      const result = await manager.fetchCalculation(MANAGER_HOUSEHOLD_META);

      // Then
      expect(mockHandlers.household.fetchMock).toHaveBeenCalledWith(MANAGER_HOUSEHOLD_META);
      expect(result).toEqual(MANAGER_OK_STATUS);
    });

    test('given economy metadata then delegates to economy handler', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.economy.fetchMock.mockResolvedValue(MANAGER_COMPUTING_STATUS);

      // Replace the real handler with mock
      (manager as any).handlers.set('economy', mockHandlers.economy);

      // When
      const result = await manager.fetchCalculation(MANAGER_ECONOMY_META);

      // Then
      expect(mockHandlers.economy.fetchMock).toHaveBeenCalledWith(MANAGER_ECONOMY_META);
      expect(result).toEqual(MANAGER_COMPUTING_STATUS);
    });

    test('given invalid type metadata then throws error', async () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When/Then
      await expect(manager.fetchCalculation(INVALID_TYPE_META)).rejects.toThrow(
        MANAGER_ERROR_MESSAGES.NO_HANDLER('invalid')
      );
    });

    test('given handler throws error then propagates error', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      const error = new Error('Fetch failed');
      mockHandlers.household.fetchMock.mockRejectedValue(error);

      // Replace the real handler with mock
      (manager as any).handlers.set('household', mockHandlers.household);

      // When/Then
      await expect(manager.fetchCalculation(MANAGER_HOUSEHOLD_META)).rejects.toThrow(
        'Fetch failed'
      );
    });
  });

  describe('startCalculation', () => {
    test('given household calculation then delegates to household handler', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.household.startCalculationMock.mockResolvedValue(undefined);

      // Replace the real handler with mock
      (manager as any).handlers.set('household', mockHandlers.household);

      // When
      await manager.startCalculation(MANAGER_TEST_REPORT_ID, MANAGER_HOUSEHOLD_META);

      // Then
      expect(mockHandlers.household.startCalculationMock).toHaveBeenCalledWith(
        MANAGER_TEST_REPORT_ID,
        MANAGER_HOUSEHOLD_META
      );
    });

    test('given economy calculation then delegates to economy handler', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.economy.startCalculationMock.mockResolvedValue(undefined);

      // Replace the real handler with mock
      (manager as any).handlers.set('economy', mockHandlers.economy);

      // When
      await manager.startCalculation(MANAGER_TEST_REPORT_ID, MANAGER_ECONOMY_META);

      // Then
      expect(mockHandlers.economy.startCalculationMock).toHaveBeenCalledWith(
        MANAGER_TEST_REPORT_ID,
        MANAGER_ECONOMY_META
      );
    });

    test('given invalid type then throws error', async () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When/Then
      await expect(
        manager.startCalculation(MANAGER_TEST_REPORT_ID, INVALID_TYPE_META)
      ).rejects.toThrow(MANAGER_ERROR_MESSAGES.NO_HANDLER('invalid'));
    });
  });

  describe('getStatus', () => {
    test('given household report then delegates to household handler', () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.household.getStatusMock.mockReturnValue(MANAGER_OK_STATUS);

      // Replace the real handler with mock
      (manager as any).handlers.set('household', mockHandlers.household);

      // When
      const result = manager.getStatus(MANAGER_TEST_REPORT_ID, 'household');

      // Then
      expect(mockHandlers.household.getStatusMock).toHaveBeenCalledWith(MANAGER_TEST_REPORT_ID);
      expect(result).toEqual(MANAGER_OK_STATUS);
    });

    test('given economy report then delegates to economy handler', () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.economy.getStatusMock.mockReturnValue(null);

      // Replace the real handler with mock
      (manager as any).handlers.set('economy', mockHandlers.economy);

      // When
      const result = manager.getStatus(MANAGER_TEST_REPORT_ID, 'economy');

      // Then
      expect(mockHandlers.economy.getStatusMock).toHaveBeenCalledWith(MANAGER_TEST_REPORT_ID);
      expect(result).toBeNull();
    });

    test('given invalid type then throws error', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When/Then
      expect(() => manager.getStatus(MANAGER_TEST_REPORT_ID, 'invalid' as any)).toThrow(
        MANAGER_ERROR_MESSAGES.NO_HANDLER('invalid')
      );
    });

    test('given no calculation found then returns null', () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const mockHandlers = createMockHandlers();
      mockHandlers.household.getStatusMock.mockReturnValue(null);

      // Replace the real handler with mock
      (manager as any).handlers.set('household', mockHandlers.household);

      // When
      const result = manager.getStatus('non-existent-report', 'household');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getCacheKey', () => {
    test('given household report then returns correct cache key', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When
      const key = manager.getCacheKey(MANAGER_TEST_REPORT_ID, 'household');

      // Then
      expect(key).toEqual(['calculation', MANAGER_TEST_REPORT_ID]);
    });

    test('given economy report then returns correct cache key', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When
      const key = manager.getCacheKey(MANAGER_TEST_REPORT_ID, 'economy');

      // Then
      expect(key).toEqual(['calculation', MANAGER_TEST_REPORT_ID]);
    });

    test('given different report ids then returns different keys', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When
      const key1 = manager.getCacheKey('report-1', 'household');
      const key2 = manager.getCacheKey('report-2', 'household');

      // Then
      expect(key1).toEqual(['calculation', 'report-1']);
      expect(key2).toEqual(['calculation', 'report-2']);
      expect(key1).not.toBe(key2);
    });

    test('given same report id different types then returns same key pattern', () => {
      // Given
      const manager = new CalculationManager(queryClient);

      // When
      const householdKey = manager.getCacheKey(MANAGER_TEST_REPORT_ID, 'household');
      const economyKey = manager.getCacheKey(MANAGER_TEST_REPORT_ID, 'economy');

      // Then
      expect(householdKey).toEqual(['calculation', MANAGER_TEST_REPORT_ID]);
      expect(economyKey).toEqual(['calculation', MANAGER_TEST_REPORT_ID]);
    });
  });

  describe('updateReportStatus', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('given complete status with result then calls markReportCompleted', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      vi.mocked(markReportCompleted).mockResolvedValue({} as any);

      // When
      await manager.updateReportStatus(
        EXISTING_REPORT_ID,
        'complete',
        TEST_COUNTRIES.US,
        MOCK_ECONOMY_RESULT
      );

      // Then
      expect(markReportCompleted).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        EXISTING_REPORT_ID,
        expect.objectContaining({
          reportId: EXISTING_REPORT_ID,
          status: 'complete',
          output: MOCK_ECONOMY_RESULT,
          countryId: TEST_COUNTRIES.US,
        })
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', EXISTING_REPORT_ID],
      });
    });

    test('given error status then calls markReportError', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      vi.mocked(markReportError).mockResolvedValue({} as any);

      // When
      await manager.updateReportStatus(EXISTING_REPORT_ID, 'error', TEST_COUNTRIES.UK);

      // Then
      expect(markReportError).toHaveBeenCalledWith(
        TEST_COUNTRIES.UK,
        EXISTING_REPORT_ID,
        expect.objectContaining({
          reportId: EXISTING_REPORT_ID,
          status: 'error',
          output: null,
          countryId: TEST_COUNTRIES.UK,
        })
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', EXISTING_REPORT_ID],
      });
    });

    test('given household result then updates report with household data', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      vi.mocked(markReportCompleted).mockResolvedValue({} as any);

      // When
      await manager.updateReportStatus(
        EXISTING_REPORT_ID,
        'complete',
        TEST_COUNTRIES.US,
        MOCK_HOUSEHOLD_RESULT
      );

      // Then
      expect(markReportCompleted).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        EXISTING_REPORT_ID,
        expect.objectContaining({
          output: MOCK_HOUSEHOLD_RESULT,
        })
      );
    });

    test('given first attempt fails then retries once', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const error = new Error('Network error');
      vi.mocked(markReportCompleted)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({} as any);

      // Mock setTimeout to run immediately
      vi.useFakeTimers();

      // When
      const updatePromise = manager.updateReportStatus(
        EXISTING_REPORT_ID,
        'complete',
        TEST_COUNTRIES.US,
        MOCK_ECONOMY_RESULT
      );

      // Advance timer to trigger retry
      await vi.advanceTimersByTimeAsync(1000);
      await updatePromise;

      // Then
      expect(markReportCompleted).toHaveBeenCalledTimes(2);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', EXISTING_REPORT_ID],
      });

      vi.useRealTimers();
    });

    test('given both attempts fail then logs error but does not throw', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const error = new Error('Persistent error');
      vi.mocked(markReportCompleted).mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock setTimeout to run immediately
      vi.useFakeTimers();

      // When
      const updatePromise = manager.updateReportStatus(
        EXISTING_REPORT_ID,
        'complete',
        TEST_COUNTRIES.US,
        MOCK_ECONOMY_RESULT
      );

      // Advance timer to trigger retry
      await vi.advanceTimersByTimeAsync(1000);
      await updatePromise;

      // Then - should not throw, just log
      expect(markReportCompleted).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to update report ${EXISTING_REPORT_ID} status to complete:`,
        error
      );
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    test('given error status update fails then retries and logs', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const error = new Error('Update failed');
      vi.mocked(markReportError)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock setTimeout to run immediately
      vi.useFakeTimers();

      // When
      const updatePromise = manager.updateReportStatus(
        EXISTING_REPORT_ID,
        'error',
        TEST_COUNTRIES.US
      );

      // Advance timer to trigger retry
      await vi.advanceTimersByTimeAsync(1000);
      await updatePromise;

      // Then
      expect(markReportError).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to update report ${EXISTING_REPORT_ID} status to error:`,
        error
      );

      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });

    test('given successful retry then invalidates cache', async () => {
      // Given
      const manager = new CalculationManager(queryClient);
      const error = new Error('Temporary error');
      vi.mocked(markReportError)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({} as any);

      // Mock setTimeout to run immediately
      vi.useFakeTimers();

      // When
      const updatePromise = manager.updateReportStatus(
        EXISTING_REPORT_ID,
        'error',
        TEST_COUNTRIES.US
      );

      // Advance timer to trigger retry
      await vi.advanceTimersByTimeAsync(1000);
      await updatePromise;

      // Then
      expect(markReportError).toHaveBeenCalledTimes(2);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['reports', 'report_id', EXISTING_REPORT_ID],
      });

      vi.useRealTimers();
    });
  });
});

describe('getCalculationManager (singleton)', () => {
  afterEach(() => {
    resetCalculationManager();
    vi.clearAllMocks();
  });

  test('given first call then creates new instance', () => {
    // Given
    const queryClient = createMockManagerQueryClient();

    // When
    const manager1 = getCalculationManager(queryClient);

    // Then
    expect(manager1).toBeDefined();
    expect(manager1).toBeInstanceOf(CalculationManager);
  });

  test('given multiple calls then returns same instance', () => {
    // Given
    const queryClient = createMockManagerQueryClient();

    // When
    const manager1 = getCalculationManager(queryClient);
    const manager2 = getCalculationManager(queryClient);
    const manager3 = getCalculationManager(queryClient);

    // Then
    expect(manager1).toBe(manager2);
    expect(manager2).toBe(manager3);
  });

  test('given reset called then creates new instance', () => {
    // Given
    const queryClient = createMockManagerQueryClient();
    const manager1 = getCalculationManager(queryClient);

    // When
    resetCalculationManager();
    const manager2 = getCalculationManager(queryClient);

    // Then
    expect(manager1).not.toBe(manager2);
    expect(manager2).toBeInstanceOf(CalculationManager);
  });

  test('given different query clients then still returns same instance', () => {
    // Given
    const queryClient1 = createMockManagerQueryClient();
    const queryClient2 = createMockManagerQueryClient();

    // When
    const manager1 = getCalculationManager(queryClient1);
    const manager2 = getCalculationManager(queryClient2);

    // Then - singleton ignores different clients
    expect(manager1).toBe(manager2);
  });
});
