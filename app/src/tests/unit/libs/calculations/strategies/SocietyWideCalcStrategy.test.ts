import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UK_REGION_SOCIETY_WIDE_DURATION_MS,
  US_DISTRICT_SOCIETY_WIDE_DURATION_MS,
  US_SOCIETY_WIDE_DURATION_MS,
  US_STATE_SOCIETY_WIDE_DURATION_MS,
} from '@/constants/calculationDurations';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
import {
  mockSocietyWideCompleteResponse,
  mockSocietyWideComputingResponse,
  mockSocietyWideErrorResponse,
  STRATEGY_TEST_CONSTANTS,
} from '@/tests/fixtures/libs/calculations/strategyFixtures';
import { mockSocietyWideCalcParams } from '@/tests/fixtures/types/calculationFixtures';
import type { CalcParams } from '@/types/calculation';

// The country estimates that legacy (v2) progress bars use
const THREE_MINUTES_MS = 3 * 60 * 1000;
const SIX_MINUTES_MS = 6 * 60 * 1000;

/** Metadata for a society-wide report run that started `elapsedMs` ago. */
const startedAgo = (elapsedMs: number) => ({
  calcId: 'test-report',
  calcType: 'societyWide' as const,
  targetType: 'report' as const,
  startedAt: Date.now() - elapsedMs,
});

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

    it('given UK constituency with prefix then passes prefixed value to API', async () => {
      // Given
      const params = mockSocietyWideCalcParams({
        countryId: 'uk',
        region: 'constituency/Sheffield Central',
      });
      mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchSocietyWideCalculation).toHaveBeenCalledWith(
        'uk',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          region: 'constituency/Sheffield Central', // Passes PREFIXED value
        })
      );
    });

    it('given UK country with prefix then passes prefixed value to API', async () => {
      // Given
      const params = mockSocietyWideCalcParams({
        countryId: 'uk',
        region: 'country/england',
      });
      mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchSocietyWideCalculation).toHaveBeenCalledWith(
        'uk',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          region: 'country/england', // Passes PREFIXED value
        })
      );
    });

    it('given US state without prefix then passes value as-is to API', async () => {
      // Given
      const params = mockSocietyWideCalcParams({
        countryId: 'us',
        region: 'ca',
      });
      mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

      // When
      await strategy.execute(params, {
        calcId: 'test',
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      });

      // Then
      expect(mockFetchSocietyWideCalculation).toHaveBeenCalledWith(
        'us',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          region: 'ca', // No prefix for US
        })
      );
    });
  });

  describe('duration estimate', () => {
    it.each<[CalcParams['countryId'], string, number]>([
      ['uk', 'uk', THREE_MINUTES_MS],
      ['uk', 'country/england', THREE_MINUTES_MS],
      ['us', 'us', SIX_MINUTES_MS],
      ['us', 'state/ca', SIX_MINUTES_MS],
      ['us', 'congressional_district/CA-46', SIX_MINUTES_MS],
    ])(
      'given the default and a %s run on %s then progress follows the %i ms country estimate',
      async (countryId, region, countryEstimateMs) => {
        // Given - half of the country estimate has passed
        const params = mockSocietyWideCalcParams({ countryId, region, populationId: region });
        mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

        // When
        const result = await strategy.execute(params, startedAgo(countryEstimateMs / 2));

        // Then - unchanged from before region estimates, with no estimate attached
        expect(result.status).toBe('pending');
        expect(result.progress).toBeCloseTo(50, 0);
        expect(result).not.toHaveProperty('estimatedDurationMs');
      }
    );

    it.each<[CalcParams['countryId'], string, number]>([
      ['uk', 'uk', UK_REGION_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'constituency/Sheffield Central', UK_REGION_SOCIETY_WIDE_DURATION_MS],
      ['us', 'us', US_SOCIETY_WIDE_DURATION_MS],
      ['us', 'state/ca', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['us', 'congressional_district/CA-46', US_DISTRICT_SOCIETY_WIDE_DURATION_MS],
    ])(
      'given estimateByRegion and a %s run on %s then progress follows the %i ms region estimate',
      async (countryId, region, regionEstimateMs) => {
        // Given - half of the region estimate has passed
        const params = mockSocietyWideCalcParams({
          countryId,
          region,
          populationId: region,
          estimateByRegion: true,
        });
        mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

        // When
        const result = await strategy.execute(params, startedAgo(regionEstimateMs / 2));

        // Then
        expect(result.status).toBe('pending');
        expect(result.progress).toBeCloseTo(50, 0);
        expect(result.estimatedDurationMs).toBe(regionEstimateMs);
      }
    );

    it('given estimateByRegion and no region then estimates a nationwide run', async () => {
      // Given
      const params = mockSocietyWideCalcParams({ region: undefined, estimateByRegion: true });
      mockFetchSocietyWideCalculation.mockResolvedValue(mockSocietyWideComputingResponse());

      // When
      const result = await strategy.execute(params, startedAgo(0));

      // Then
      expect(result.estimatedDurationMs).toBe(US_SOCIETY_WIDE_DURATION_MS);
    });

    it('given a region without estimateByRegion then the transform ignores the region', () => {
      // When
      const result = strategy.transformResponseWithMetadata(
        mockSocietyWideComputingResponse(),
        startedAgo(SIX_MINUTES_MS / 2),
        'us',
        { region: 'state/ca' }
      );

      // Then
      expect(result.progress).toBeCloseTo(50, 0);
      expect(result).not.toHaveProperty('estimatedDurationMs');
    });

    it('given estimateByRegion and API stage fields then passes the run stage on', () => {
      // When
      const result = strategy.transformResponseWithMetadata(
        {
          ...mockSocietyWideComputingResponse(),
          stage: 'simulating',
          progress: 5,
          progress_max: 96,
          segments: { completed: 19, total: 20 },
        },
        startedAgo(1000),
        'us',
        { estimateByRegion: true }
      );

      // Then
      expect(result.runStage).toEqual({
        stage: 'simulating',
        floor: 5,
        max: 96,
        segments: { completed: 19, total: 20 },
      });
    });

    it('given API stage fields without estimateByRegion then the v2 status is unchanged', () => {
      // When
      const result = strategy.transformResponseWithMetadata(
        { ...mockSocietyWideComputingResponse(), stage: 'reform', progress: 67, progress_max: 96 },
        startedAgo(1000),
        'us'
      );

      // Then
      expect(result).not.toHaveProperty('runStage');
    });

    it('given estimateByRegion and no API stage fields then there is no run stage', () => {
      // When
      const result = strategy.transformResponseWithMetadata(
        mockSocietyWideComputingResponse(),
        startedAgo(1000),
        'us',
        { estimateByRegion: true }
      );

      // Then
      expect(result).not.toHaveProperty('runStage');
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
      // 1 minute elapsed / 6 minute estimate = 16.67%
      expect(result.progress).toBeCloseTo(16.67, 0);
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
      // Uses default (6 minutes for US): 1 minute / 6 minutes = 16.67%
      expect(result.progress).toBeCloseTo(16.67, 0);
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
      // Uses default (6 minutes for US): 2.5 minutes / 6 minutes = 41.67%
      expect(result.progress).toBeCloseTo(41.67, 0);
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
