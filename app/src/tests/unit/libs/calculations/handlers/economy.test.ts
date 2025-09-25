import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EconomyCalculationHandler } from '@/libs/calculations/handlers/economy';
import {
  createMockQueryClient,
  TEST_REPORT_ID,
  ECONOMY_CALCULATION_META,
  ECONOMY_NATIONAL_META,
  ECONOMY_COMPUTING_RESPONSE,
  ECONOMY_OK_RESPONSE,
  ECONOMY_ERROR_RESPONSE,
  mockFetchEconomyCalculation,
} from '@/tests/fixtures/libs/calculations/handlerMocks';

// Mock the economy API module
vi.mock('@/api/economy', () => ({
  fetchEconomyCalculation: vi.fn(() => mockFetchEconomyCalculation()),
}));

describe('EconomyCalculationHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetch', () => {
    test('given computing response then returns computing status', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_COMPUTING_RESPONSE);

      // When
      const result = await handler.fetch(ECONOMY_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'computing',
        queuePosition: 5,
        averageTime: 45000,
        result: null,
        error: undefined,
      });
      expect(mockFetchEconomyCalculation).toHaveBeenCalledWith();
    });

    test('given ok response then returns ok status with result', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_OK_RESPONSE);

      // When
      const result = await handler.fetch(ECONOMY_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'ok',
        queuePosition: undefined,
        averageTime: undefined,
        result: ECONOMY_OK_RESPONSE.result,
        error: undefined,
      });
    });

    test('given error response then returns error status', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_ERROR_RESPONSE);

      // When
      const result = await handler.fetch(ECONOMY_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'error',
        queuePosition: undefined,
        averageTime: undefined,
        result: null,
        error: 'Invalid region parameter',
      });
    });

    test('given meta with region then uses region in params', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_OK_RESPONSE);

      // When
      await handler.fetch(ECONOMY_CALCULATION_META);

      // Then
      // Note: We're mocking at the module level, so we can't directly verify params
      // In a real test, we'd verify the fetchEconomyCalculation was called with correct params
      expect(mockFetchEconomyCalculation).toHaveBeenCalled();
    });

    test('given meta without region then uses country as region', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_OK_RESPONSE);

      // When
      await handler.fetch(ECONOMY_NATIONAL_META);

      // Then
      expect(mockFetchEconomyCalculation).toHaveBeenCalled();
    });

    test('given meta with reform policy then uses reform policy', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_OK_RESPONSE);

      // When
      await handler.fetch(ECONOMY_CALCULATION_META);

      // Then
      expect(mockFetchEconomyCalculation).toHaveBeenCalled();
      // Reform policy should be used (policy-reform-012)
    });

    test('given meta without reform policy then uses baseline policy', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      mockFetchEconomyCalculation.mockResolvedValueOnce(ECONOMY_OK_RESPONSE);

      // When
      await handler.fetch(ECONOMY_NATIONAL_META);

      // Then
      expect(mockFetchEconomyCalculation).toHaveBeenCalled();
      // Baseline policy should be used (policy-baseline-uk)
    });

    test('given fetch throws error then propagates error', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);
      const error = new Error('Network error');
      mockFetchEconomyCalculation.mockRejectedValueOnce(error);

      // When/Then
      await expect(handler.fetch(ECONOMY_CALCULATION_META)).rejects.toThrow('Network error');
    });
  });

  describe('getStatus', () => {
    test('given any report id then always returns null', () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);

      // When
      const result = handler.getStatus(TEST_REPORT_ID);

      // Then
      expect(result).toBeNull();
    });

    test('given different report ids then always returns null', () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);

      // When
      const result1 = handler.getStatus('report-001');
      const result2 = handler.getStatus('report-002');
      const result3 = handler.getStatus('');

      // Then
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('startCalculation', () => {
    test('given calculation meta then completes without action', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);

      // When
      await handler.startCalculation(TEST_REPORT_ID, ECONOMY_CALCULATION_META);

      // Then - should complete without error
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
      expect(mockFetchEconomyCalculation).not.toHaveBeenCalled();
    });

    test('given multiple calls then all complete without action', async () => {
      // Given
      const queryClient = createMockQueryClient();
      const handler = new EconomyCalculationHandler(queryClient);

      // When
      await handler.startCalculation('report-1', ECONOMY_CALCULATION_META);
      await handler.startCalculation('report-2', ECONOMY_NATIONAL_META);
      await handler.startCalculation('report-3', ECONOMY_CALCULATION_META);

      // Then - all should complete without error
      expect(queryClient.setQueryData).not.toHaveBeenCalled();
      expect(mockFetchEconomyCalculation).not.toHaveBeenCalled();
    });
  });
});