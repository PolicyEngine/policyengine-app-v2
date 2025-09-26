import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EconomyCalculationHandler } from '@/libs/calculations/handlers/economy';
import * as economyApi from '@/api/economy';
import {
  TEST_REPORT_ID,
  ECONOMY_CALCULATION_META,
  ECONOMY_COMPUTING_RESPONSE,
  ECONOMY_OK_RESPONSE,
  ECONOMY_ERROR_RESPONSE,
} from '@/tests/fixtures/libs/calculations/handlerMocks';

// Mock the API
vi.mock('@/api/economy');

describe('EconomyCalculationHandler', () => {
  let handler: EconomyCalculationHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new EconomyCalculationHandler();
  });

  describe('execute', () => {
    test('given economy calculation request then calls API and returns computing status', async () => {
      // Given
      vi.mocked(economyApi.fetchEconomyCalculation).mockResolvedValue(ECONOMY_COMPUTING_RESPONSE);

      // When
      const result = await handler.execute(TEST_REPORT_ID, ECONOMY_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'computing',
        queuePosition: 5,
        averageTime: 45000,
        result: null,
        error: undefined,
      });
      expect(economyApi.fetchEconomyCalculation).toHaveBeenCalledWith(
        ECONOMY_CALCULATION_META.countryId,
        ECONOMY_CALCULATION_META.policyIds.reform,
        ECONOMY_CALCULATION_META.policyIds.baseline,
        {
          region: 'ca',
          time_period: '2024',
        }
      );
    });

    test('given completed economy calculation then returns ok status', async () => {
      // Given
      vi.mocked(economyApi.fetchEconomyCalculation).mockResolvedValue(ECONOMY_OK_RESPONSE);

      // When
      const result = await handler.execute(TEST_REPORT_ID, ECONOMY_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'ok',
        queuePosition: undefined,
        averageTime: undefined,
        result: ECONOMY_OK_RESPONSE.result,
        error: undefined,
      });
    });

    test('given failed economy calculation then returns error status', async () => {
      // Given
      vi.mocked(economyApi.fetchEconomyCalculation).mockResolvedValue(ECONOMY_ERROR_RESPONSE);

      // When
      const result = await handler.execute(TEST_REPORT_ID, ECONOMY_CALCULATION_META);

      // Then
      expect(result).toEqual({
        status: 'error',
        queuePosition: undefined,
        averageTime: undefined,
        result: null,
        error: 'Invalid region parameter',
      });
    });

    test('given multiple calls then makes fresh API calls each time', async () => {
      // Given
      vi.mocked(economyApi.fetchEconomyCalculation)
        .mockResolvedValueOnce(ECONOMY_COMPUTING_RESPONSE)
        .mockResolvedValueOnce(ECONOMY_OK_RESPONSE);

      // When - first call
      const result1 = await handler.execute(TEST_REPORT_ID, ECONOMY_CALCULATION_META);
      expect(result1.status).toBe('computing');

      // When - second call
      const result2 = await handler.execute(TEST_REPORT_ID, ECONOMY_CALCULATION_META);
      expect(result2.status).toBe('ok');

      // Then
      expect(economyApi.fetchEconomyCalculation).toHaveBeenCalledTimes(2);
    });

    test('given national calculation then uses countryId as region', async () => {
      // Given
      const nationalMeta = {
        ...ECONOMY_CALCULATION_META,
        region: undefined,
      };
      vi.mocked(economyApi.fetchEconomyCalculation).mockResolvedValue(ECONOMY_OK_RESPONSE);

      // When
      await handler.execute(TEST_REPORT_ID, nationalMeta);

      // Then
      expect(economyApi.fetchEconomyCalculation).toHaveBeenCalledWith(
        nationalMeta.countryId,
        nationalMeta.policyIds.reform,
        nationalMeta.policyIds.baseline,
        {
          region: nationalMeta.countryId,
          time_period: '2024',
        }
      );
    });

    test('given baseline-only calculation then uses baseline as reform', async () => {
      // Given
      const baselineOnlyMeta = {
        ...ECONOMY_CALCULATION_META,
        policyIds: {
          baseline: 'policy-baseline',
          reform: undefined,
        },
      };
      vi.mocked(economyApi.fetchEconomyCalculation).mockResolvedValue(ECONOMY_OK_RESPONSE);

      // When
      await handler.execute(TEST_REPORT_ID, baselineOnlyMeta);

      // Then
      expect(economyApi.fetchEconomyCalculation).toHaveBeenCalledWith(
        baselineOnlyMeta.countryId,
        'policy-baseline', // Uses baseline when reform is undefined
        'policy-baseline',
        expect.any(Object)
      );
    });

    test('given API error then propagates the error', async () => {
      // Given
      const apiError = new Error('Network error');
      vi.mocked(economyApi.fetchEconomyCalculation).mockRejectedValue(apiError);

      // When/Then
      await expect(handler.execute(TEST_REPORT_ID, ECONOMY_CALCULATION_META)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getStatus', () => {
    test('given any reportId then always returns null', () => {
      // When
      const status = handler.getStatus(TEST_REPORT_ID);

      // Then
      expect(status).toBeNull();
    });

    test('given non-existent calculation then returns null', () => {
      // When
      const status = handler.getStatus('non-existent-id');

      // Then
      expect(status).toBeNull();
    });
  });

  describe('isActive', () => {
    test('given any reportId then always returns false', () => {
      // When
      const isActive = handler.isActive(TEST_REPORT_ID);

      // Then
      expect(isActive).toBe(false);
    });

    test('given non-existent calculation then returns false', () => {
      // When
      const isActive = handler.isActive('non-existent-id');

      // Then
      expect(isActive).toBe(false);
    });
  });
});