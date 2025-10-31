import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
import {
  mockSocietyWideCompleteResponse,
  mockSocietyWideComputingResponse,
  mockSocietyWideErrorResponse,
  STRATEGY_TEST_CONSTANTS,
} from '@/tests/fixtures/libs/calculations/strategyFixtures';
import { mockSocietyWideCalcParams } from '@/tests/fixtures/types/calculationFixtures';

// Mock the societyWide API
vi.mock('@/api/societyWideCalculation', () => ({
  fetchSocietyWideCalculation: vi.fn(),
  SocietyWideCalculationParams: {},
  SocietyWideCalculationResponse: {},
}));

describe('SocietyWideCalcStrategy', () => {
  let strategy: SocietyWideCalcStrategy;
  let mockFetchSocietyWideCalculation: any;

  beforeEach(async () => {
    strategy = new SocietyWideCalcStrategy();
    const societyWideModule = await import('@/api/societyWideCalculation');
    mockFetchSocietyWideCalculation = societyWideModule.fetchSocietyWideCalculation as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('given valid params then calls API with correct parameters', async () => {
      // Given
      const params = mockSocietyWideCalcParams();
      mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchSocietyWideCalculation).toHaveBeenCalledWith(
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
      const params = mockSocietyWideCalcParams();
      const apiResponse = mockSocietyWideComputingResponse();
      mockFetchSocietyWideCalculation.mockResolvedValue(apiResponse);

      // When
      const result = await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(result.status).toBe('pending');
      expect(result.queuePosition).toBe(STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION);
      expect(result.estimatedTimeRemaining).toBe(
        STRATEGY_TEST_CONSTANTS.SOCIETY_WIDE_AVERAGE_TIME_MS
      );
      expect(result.message).toContain(`position ${STRATEGY_TEST_CONSTANTS.TEST_QUEUE_POSITION}`);
    });

    it('given complete response then returns complete status', async () => {
      // Given
      const params = mockSocietyWideCalcParams();
      const apiResponse = mockSocietyWideCompleteResponse();
      mockFetchSocietyWideCalculation.mockResolvedValue(apiResponse);

      // When
      const result = await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('given error response then returns error status', async () => {
      // Given
      const params = mockSocietyWideCalcParams();
      const apiResponse = mockSocietyWideErrorResponse();
      mockFetchSocietyWideCalculation.mockResolvedValue(apiResponse);

      // When
      const result = await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('SOCIETY_WIDE_CALC_ERROR');
      expect(result.error?.retryable).toBe(true);
    });

    it('given no region then uses countryId as region', async () => {
      // Given
      const params = mockSocietyWideCalcParams({ region: undefined });
      mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchSocietyWideCalculation).toHaveBeenCalledWith(
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
      expect(interval).toBe(STRATEGY_TEST_CONSTANTS.SOCIETY_WIDE_REFETCH_INTERVAL_MS);
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
      const apiResponse = mockSocietyWideComputingResponse();

      // When
      const result = strategy.transformResponse(apiResponse);

      // Then
      expect(result.status).toBe('pending');
      expect(result.queuePosition).toBe(apiResponse.queue_position);
      expect(result.metadata.calcType).toBe('societyWide');
    });

    it('given complete response then transforms to CalcStatus correctly', () => {
      // Given
      const apiResponse = mockSocietyWideCompleteResponse();

      // When
      const result = strategy.transformResponse(apiResponse);

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toBeDefined();
    });

    it('given error response then transforms to CalcStatus correctly', () => {
      // Given
      const apiResponse = mockSocietyWideErrorResponse();

      // When
      const result = strategy.transformResponse(apiResponse);

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
    });
  });

  describe('transformResponseWithMetadata', () => {
    it('given computing response with US country then includes synthetic progress', () => {
      // Given
      const apiResponse = mockSocietyWideComputingResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 60000, // Started 1 minute ago
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata, 'us');

      // Then
      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      expect(result.progress).toBeGreaterThan(0);
      // 1 minute elapsed / 5 minute estimate = 20%
      expect(result.progress).toBeCloseTo(20, 0);
    });

    it('given computing response with UK country then uses UK duration estimate', () => {
      // Given
      const apiResponse = mockSocietyWideComputingResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 90000, // Started 1.5 minutes ago
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata, 'uk');

      // Then
      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      // 1.5 minutes elapsed / 3 minute estimate = 50%
      expect(result.progress).toBeCloseTo(50, 0);
    });

    it('given computing response with unknown country then uses default duration', () => {
      // Given
      const apiResponse = mockSocietyWideComputingResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 60000, // Started 1 minute ago
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata, 'ca');

      // Then
      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      // Uses default (5 minutes): 1 minute / 5 minutes = 20%
      expect(result.progress).toBeCloseTo(20, 0);
    });

    it('given computing response with no country then uses default duration', () => {
      // Given
      const apiResponse = mockSocietyWideComputingResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 150000, // Started 2.5 minutes ago
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata);

      // Then
      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      // Uses default (5 minutes): 2.5 minutes / 5 minutes = 50%
      expect(result.progress).toBeCloseTo(50, 0);
    });

    it('given long-running calculation then caps progress at 95%', () => {
      // Given
      const apiResponse = mockSocietyWideComputingResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 600000, // Started 10 minutes ago (longer than estimate)
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata, 'us');

      // Then
      expect(result.status).toBe('pending');
      expect(result.progress).toBe(95);
    });

    it('given just-started calculation then shows low progress', () => {
      // Given
      const apiResponse = mockSocietyWideComputingResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 1000, // Started 1 second ago
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata, 'us');

      // Then
      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      expect(result.progress).toBeLessThan(1);
    });

    it('given complete response then returns complete status without progress', () => {
      // Given
      const apiResponse = mockSocietyWideCompleteResponse();
      const metadata = {
        calcId: 'test-report',
        calcType: 'societyWide' as const,
        targetType: 'report' as const,
        startedAt: Date.now() - 60000,
      };

      // When
      const result = strategy.transformResponseWithMetadata(apiResponse, metadata, 'us');

      // Then
      expect(result.status).toBe('complete');
      expect(result.progress).toBeUndefined();
      expect(result.result).toBeDefined();
    });
  });
});
