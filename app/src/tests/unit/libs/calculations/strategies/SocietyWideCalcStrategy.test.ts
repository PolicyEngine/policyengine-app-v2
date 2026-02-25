import { Query } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocietyWideCalcStrategy } from '@/libs/calculations/economy/SocietyWideCalcStrategy';
import {
  mockEconomyCompletedResponse,
  mockEconomyFailedResponse,
  mockEconomyPendingResponse,
  mockEconomyRunningResponse,
  STRATEGY_TEST_CONSTANTS,
  TEST_REPORT_IDS,
} from '@/tests/fixtures/libs/calculations/strategyFixtures';
import { mockSocietyWideCalcParams } from '@/tests/fixtures/types/calculationFixtures';
import { CalcMetadata } from '@/types/calculation';

// Mock the v2 API module
vi.mock('@/api/v2/economyAnalysis', () => ({
  createEconomyAnalysis: vi.fn(),
  getEconomyAnalysis: vi.fn(),
}));

// Mock getDatasetForRegion (pure utility kept in v1 module)
vi.mock('@/api/societyWideCalculation', () => ({
  getDatasetForRegion: vi.fn((countryId: string, region: string) => {
    if (countryId === 'us' && region === 'us') {
      return 'enhanced_cps';
    }
    return undefined;
  }),
}));

describe('SocietyWideCalcStrategy', () => {
  let strategy: SocietyWideCalcStrategy;
  let mockCreateEconomyAnalysis: any;
  let mockGetEconomyAnalysis: any;

  const mockMetadata: CalcMetadata = {
    calcId: 'test-calc-id',
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: Date.now(),
  };

  beforeEach(async () => {
    strategy = new SocietyWideCalcStrategy();

    const economyModule = await import('@/api/v2/economyAnalysis');
    mockCreateEconomyAnalysis = economyModule.createEconomyAnalysis;
    mockGetEconomyAnalysis = economyModule.getEconomyAnalysis;

    vi.clearAllMocks();
  });

  describe('execute (first call - job creation)', () => {
    it('given first call then creates economy analysis with correct request', async () => {
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );

      const result = await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith({
        tax_benefit_model_name: 'policyengine_us',
        region: 'us',
        policy_id: '2', // reform takes precedence
        dataset_id: 'enhanced_cps', // US nationwide gets enhanced CPS
      });
      expect(result.status).toBe('pending');
      expect(result.progress).toBe(0);
      expect(result.message).toBe('Starting economy analysis...');
    });

    it('given no reform policy then uses baseline policy_id', async () => {
      const params = mockSocietyWideCalcParams({
        policyIds: { baseline: 'baseline-id' },
      });
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ policy_id: 'baseline-id' })
      );
    });

    it('given null policies then sends null policy_id', async () => {
      const params = mockSocietyWideCalcParams({
        policyIds: { baseline: null },
      });
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ policy_id: null })
      );
    });

    it('given UK region then does not set dataset_id', async () => {
      const params = mockSocietyWideCalcParams({
        countryId: 'uk',
        region: 'uk',
      });
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_benefit_model_name: 'policyengine_uk',
          region: 'uk',
          dataset_id: null,
        })
      );
    });

    it('given US state region then does not set enhanced_cps dataset', async () => {
      const params = mockSocietyWideCalcParams({
        countryId: 'us',
        region: 'ca',
      });
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'ca',
          dataset_id: null,
        })
      );
    });

    it('given no region then uses countryId as region', async () => {
      const params = mockSocietyWideCalcParams({ region: undefined });
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'us' })
      );
    });

    it('given UK constituency with prefix then passes prefixed region', async () => {
      const params = mockSocietyWideCalcParams({
        countryId: 'uk',
        region: 'constituency/Sheffield Central',
      });
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'constituency/Sheffield Central' })
      );
    });

    it('given job creation fails then returns error status', async () => {
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockRejectedValue(new Error('Job creation failed'));

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'ECONOMY_ANALYSIS_FAILED',
        message: 'Job creation failed',
        retryable: true,
      });
    });
  });

  describe('execute (subsequent calls - polling)', () => {
    beforeEach(async () => {
      // Set up a job in the registry
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );
      await strategy.execute(params, mockMetadata);
      vi.clearAllMocks();
    });

    it('given pending status then returns pending with progress', async () => {
      const params = mockSocietyWideCalcParams();
      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Waiting in queue...');
      expect(mockCreateEconomyAnalysis).not.toHaveBeenCalled();
    });

    it('given running status then returns pending with running message', async () => {
      const params = mockSocietyWideCalcParams();
      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyRunningResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Running economy analysis...');
    });

    it('given completed status then returns complete with response as result', async () => {
      const params = mockSocietyWideCalcParams();
      const completedResponse = mockEconomyCompletedResponse();
      mockGetEconomyAnalysis.mockResolvedValue(completedResponse);

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('complete');
      expect(result.result).toEqual(completedResponse);
    });

    it('given failed status then returns error', async () => {
      const params = mockSocietyWideCalcParams();
      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyFailedResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'ECONOMY_ANALYSIS_FAILED',
        message: 'Calculation failed due to invalid parameters',
        retryable: true,
      });
    });

    it('given failed status with no message then uses default error message', async () => {
      const params = mockSocietyWideCalcParams();
      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyFailedResponse({ error_message: null }));

      const result = await strategy.execute(params, mockMetadata);

      expect(result.error?.message).toBe('Economy analysis failed');
    });

    it('given single poll error then returns pending to retry', async () => {
      const params = mockSocietyWideCalcParams();
      mockGetEconomyAnalysis.mockRejectedValue(new Error('Network error'));

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Retrying status check...');
    });

    it('given max consecutive poll errors then returns error status', async () => {
      const params = mockSocietyWideCalcParams();
      mockGetEconomyAnalysis.mockRejectedValue(new Error('Persistent network error'));

      await strategy.execute(params, mockMetadata); // Error 1
      await strategy.execute(params, mockMetadata); // Error 2
      const result = await strategy.execute(params, mockMetadata); // Error 3

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('POLL_FAILED');
      expect(result.error?.message).toContain('failed after 3 attempts');
      expect(result.error?.message).toContain('Persistent network error');
    });

    it('given successful poll after errors then resets error count', async () => {
      const params = mockSocietyWideCalcParams();

      mockGetEconomyAnalysis
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockEconomyRunningResponse())
        .mockRejectedValueOnce(new Error('Network error'));

      await strategy.execute(params, mockMetadata); // Error 1
      await strategy.execute(params, mockMetadata); // Error 2
      await strategy.execute(params, mockMetadata); // Success - resets
      const result = await strategy.execute(params, mockMetadata); // Error 1 (reset)

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Retrying status check...');
    });

    it('given pending status then shows synthetic progress based on elapsed time', async () => {
      const params = mockSocietyWideCalcParams();
      const metadataWithOldStart: CalcMetadata = {
        ...mockMetadata,
        startedAt: Date.now() - 60000, // Started 1 minute ago
      };

      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      const result = await strategy.execute(params, metadataWithOldStart);

      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      expect(result.progress).toBeGreaterThan(0);
      // 1 minute elapsed / 6 minute US estimate = ~16.67%
      expect(result.progress).toBeCloseTo(16.67, 0);
    });

    it('given long-running calculation then caps progress at 95%', async () => {
      const params = mockSocietyWideCalcParams();
      const metadataWithOldStart: CalcMetadata = {
        ...mockMetadata,
        startedAt: Date.now() - 600000, // Started 10 minutes ago
      };

      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyPendingResponse());

      const result = await strategy.execute(params, metadataWithOldStart);

      expect(result.progress).toBe(STRATEGY_TEST_CONSTANTS.MAX_SYNTHETIC_PROGRESS);
    });

    it('given UK country then uses UK duration estimate for progress', async () => {
      // Need a fresh strategy with UK job
      const ukStrategy = new SocietyWideCalcStrategy();
      const ukParams = mockSocietyWideCalcParams({ countryId: 'uk', region: 'uk' });

      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: 'uk-report' })
      );
      await ukStrategy.execute(ukParams, mockMetadata);
      vi.clearAllMocks();

      const metadataWithOldStart: CalcMetadata = {
        ...mockMetadata,
        startedAt: Date.now() - 90000, // Started 1.5 minutes ago
      };
      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyRunningResponse());

      const result = await ukStrategy.execute(ukParams, metadataWithOldStart);

      // 1.5 minutes elapsed / 3 minute UK estimate = 50%
      expect(result.progress).toBeCloseTo(50, 0);
    });
  });

  describe('getRefetchConfig', () => {
    it('given pending status then returns 1 second poll interval', () => {
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: { status: 'pending' } },
      } as unknown as Query;

      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      expect(interval).toBe(STRATEGY_TEST_CONSTANTS.SOCIETY_WIDE_REFETCH_INTERVAL_MS);
    });

    it('given complete status then returns false (stop polling)', () => {
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: { status: 'complete' } },
      } as unknown as Query;

      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      expect(interval).toBe(false);
    });

    it('given error status then returns false (stop polling)', () => {
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: { status: 'error' } },
      } as unknown as Query;

      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      expect(interval).toBe(false);
    });

    it('given no data then returns false', () => {
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: undefined },
      } as unknown as Query;

      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      expect(interval).toBe(false);
    });

    it('given config then returns infinite stale time', () => {
      const config = strategy.getRefetchConfig();
      expect(config.staleTime).toBe(Infinity);
    });
  });

  describe('transformResponse', () => {
    it('given response data then transforms to complete CalcStatus', () => {
      const data = { some: 'result' };
      const result = strategy.transformResponse(data);

      expect(result.status).toBe('complete');
      expect(result.result).toEqual(data);
      expect(result.metadata.calcType).toBe('societyWide');
      expect(result.metadata.targetType).toBe('report');
    });
  });

  describe('job registry management', () => {
    it('given new calculation then has no active job', () => {
      expect(strategy.hasActiveJob('new-calc-id')).toBe(false);
    });

    it('given job created then has active job', async () => {
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );

      await strategy.execute(params, mockMetadata);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(true);
    });

    it('given cleanupJob called then removes job from registry', async () => {
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );
      await strategy.execute(params, mockMetadata);

      strategy.cleanupJob(mockMetadata.calcId);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });

    it('given completed job then removes from registry', async () => {
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );
      await strategy.execute(params, mockMetadata);

      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyCompletedResponse());
      await strategy.execute(params, mockMetadata);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });

    it('given failed job then removes from registry', async () => {
      const params = mockSocietyWideCalcParams();
      mockCreateEconomyAnalysis.mockResolvedValue(
        mockEconomyPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );
      await strategy.execute(params, mockMetadata);

      mockGetEconomyAnalysis.mockResolvedValue(mockEconomyFailedResponse());
      await strategy.execute(params, mockMetadata);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });
  });
});
