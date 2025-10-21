import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EconomyCalcStrategy } from '@/libs/calculations/strategies/EconomyCalcStrategy';
import { mockEconomyCalcParams } from '@/tests/fixtures/types/calculationFixtures';
import {
  mockEconomyComputingResponse,
  mockEconomyCompleteResponse,
  mockEconomyErrorResponse,
  STRATEGY_TEST_CONSTANTS,
} from '@/tests/fixtures/libs/calculations/strategyFixtures';

// Mock the economy API
vi.mock('@/api/economy', () => ({
  fetchEconomyCalculation: vi.fn(),
  EconomyCalculationParams: {},
  EconomyCalculationResponse: {},
}));

describe('EconomyCalcStrategy', () => {
  let strategy: EconomyCalcStrategy;
  let mockFetchEconomyCalculation: any;

  beforeEach(async () => {
    strategy = new EconomyCalcStrategy();
    const economyModule = await import('@/api/economy');
    mockFetchEconomyCalculation = economyModule.fetchEconomyCalculation as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('given valid params then calls API with correct parameters', async () => {
      // Given
      const params = mockEconomyCalcParams();
      mockFetchEconomyCalculation.mockResolvedValue(mockEconomyComputingResponse());

      // When
      await strategy.execute(params, { calcId: "test", calcType: "household", targetType: "simulation", startedAt: Date.now() });

      // Then
      expect(mockFetchEconomyCalculation).toHaveBeenCalledWith(
        params.countryId,
        params.policyIds.reform,
        params.policyIds.baseline,
        expect.objectContaining({
          region: params.region,
          time_period: expect.any(String),
        })
      );
    });

    it('given computing response then returns computing status', async () => {
      // Given
      const params = mockEconomyCalcParams();
      const apiResponse = mockEconomyComputingResponse();
      mockFetchEconomyCalculation.mockResolvedValue(apiResponse);

      // When
      const result = await strategy.execute(params, { calcId: "test", calcType: "household", targetType: "simulation", startedAt: Date.now() });

      // Then
      expect(result.status).toBe('computing');
      expect(result.queuePosition).toBe(STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION);
      expect(result.estimatedTimeRemaining).toBe(STRATEGY_TEST_CONSTANTS.ECONOMY_AVERAGE_TIME_MS);
      expect(result.message).toContain(`position ${STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION}`);
    });

    it('given complete response then returns complete status', async () => {
      // Given
      const params = mockEconomyCalcParams();
      const apiResponse = mockEconomyCompleteResponse();
      mockFetchEconomyCalculation.mockResolvedValue(apiResponse);

      // When
      const result = await strategy.execute(params, { calcId: "test", calcType: "household", targetType: "simulation", startedAt: Date.now() });

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('given error response then returns error status', async () => {
      // Given
      const params = mockEconomyCalcParams();
      const apiResponse = mockEconomyErrorResponse();
      mockFetchEconomyCalculation.mockResolvedValue(apiResponse);

      // When
      const result = await strategy.execute(params, { calcId: "test", calcType: "household", targetType: "simulation", startedAt: Date.now() });

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('ECONOMY_CALC_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    it('given no region then uses countryId as region', async () => {
      // Given
      const params = mockEconomyCalcParams({ region: undefined });
      mockFetchEconomyCalculation.mockResolvedValue(mockEconomyComputingResponse());

      // When
      await strategy.execute(params, { calcId: "test", calcType: "household", targetType: "simulation", startedAt: Date.now() });

      // Then
      expect(mockFetchEconomyCalculation).toHaveBeenCalledWith(
        params.countryId,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          region: params.countryId,
        })
      );
    });
  });

  describe('getRefetchConfig', () => {
    it('given config requested then returns valid refetch configuration', () => {
      // When
      const config = strategy.getRefetchConfig();

      // Then
      expect(config).toHaveProperty('refetchInterval');
      expect(config).toHaveProperty('staleTime');
      expect(config.staleTime).toBe(Infinity);
    });

    it('given computing status then refetch interval is 1000ms', () => {
      // Given
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: {
          data: { status: 'pending' },
        },
      } as any;

      // When
      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      // Then
      expect(interval).toBe(STRATEGY_TEST_CONSTANTS.ECONOMY_REFETCH_INTERVAL_MS);
    });

    it('given complete status then refetch interval is false', () => {
      // Given
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: {
          data: { status: 'complete' },
        },
      } as any;

      // When
      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      // Then
      expect(interval).toBe(false);
    });
  });

  describe('transformResponse', () => {
    it('given computing response then transforms to CalcStatus correctly', () => {
      // Given
      const apiResponse = mockEconomyComputingResponse();

      // When
      const result = strategy.transformResponse(apiResponse);

      // Then
      expect(result.status).toBe('computing');
      expect(result.queuePosition).toBe(apiResponse.queue_position);
      expect(result.metadata.calcType).toBe('economy');
    });

    it('given complete response then transforms to CalcStatus correctly', () => {
      // Given
      const apiResponse = mockEconomyCompleteResponse();

      // When
      const result = strategy.transformResponse(apiResponse);

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toBeDefined();
    });

    it('given error response then transforms to CalcStatus correctly', () => {
      // Given
      const apiResponse = mockEconomyErrorResponse();

      // When
      const result = strategy.transformResponse(apiResponse);

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });
});
