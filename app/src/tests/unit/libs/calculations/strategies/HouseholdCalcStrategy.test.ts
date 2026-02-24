import { Query } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import { HouseholdCalcStrategy } from '@/libs/calculations/strategies/HouseholdCalcStrategy';
import { mockHouseholdCalcParams } from '@/tests/fixtures/types/calculationFixtures';
import { CalcMetadata } from '@/types/calculation';

// Mock the v2 analysis API module
vi.mock('@/api/v2/householdAnalysis', () => ({
  createHouseholdAnalysis: vi.fn(),
  getHouseholdAnalysis: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TEST_REPORT_IDS = {
  PENDING: 'hh-report-pending-123',
  RUNNING: 'hh-report-running-456',
  COMPLETED: 'hh-report-completed-789',
  FAILED: 'hh-report-failed-000',
} as const;

const mockHouseholdPendingResponse = (
  overrides?: Partial<HouseholdImpactResponse>
): HouseholdImpactResponse => ({
  report_id: TEST_REPORT_IDS.PENDING,
  report_type: 'household',
  status: 'pending',
  baseline_simulation: { id: 'sim-baseline', status: 'pending', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'pending', error_message: null },
  baseline_result: null,
  reform_result: null,
  impact: null,
  error_message: null,
  ...overrides,
});

const mockHouseholdRunningResponse = (
  overrides?: Partial<HouseholdImpactResponse>
): HouseholdImpactResponse => ({
  ...mockHouseholdPendingResponse(),
  report_id: TEST_REPORT_IDS.RUNNING,
  status: 'running',
  baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'running', error_message: null },
  ...overrides,
});

const mockHouseholdCompletedResponse = (
  overrides?: Partial<HouseholdImpactResponse>
): HouseholdImpactResponse => ({
  ...mockHouseholdPendingResponse(),
  report_id: TEST_REPORT_IDS.COMPLETED,
  status: 'completed',
  baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
  baseline_result: { person: [{ net_income: 42000 }], household: [{ size: 2 }] },
  reform_result: { person: [{ net_income: 44000 }], household: [{ size: 2 }] },
  impact: { person: [{ net_income: 2000 }] },
  ...overrides,
});

const mockHouseholdFailedResponse = (
  overrides?: Partial<HouseholdImpactResponse>
): HouseholdImpactResponse => ({
  ...mockHouseholdPendingResponse(),
  report_id: TEST_REPORT_IDS.FAILED,
  status: 'failed',
  error_message: 'Household analysis calculation error',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HouseholdCalcStrategy', () => {
  let strategy: HouseholdCalcStrategy;
  let mockCreateHouseholdAnalysis: any;
  let mockGetHouseholdAnalysis: any;

  const mockMetadata: CalcMetadata = {
    calcId: 'test-calc-id',
    calcType: 'household',
    targetType: 'simulation',
    startedAt: Date.now(),
  };

  beforeEach(async () => {
    strategy = new HouseholdCalcStrategy();

    const analysisModule = await import('@/api/v2/householdAnalysis');
    mockCreateHouseholdAnalysis = analysisModule.createHouseholdAnalysis;
    mockGetHouseholdAnalysis = analysisModule.getHouseholdAnalysis;

    vi.clearAllMocks();
  });

  describe('execute (first call - job creation)', () => {
    it('given first call then creates household analysis with correct request', async () => {
      const params = mockHouseholdCalcParams({
        populationId: 'household-abc',
        policyIds: { baseline: 'baseline-id', reform: 'reform-id' },
      });
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(mockCreateHouseholdAnalysis).toHaveBeenCalledWith({
        household_id: 'household-abc',
        policy_id: 'reform-id',
      });
      expect(result.status).toBe('pending');
      expect(result.progress).toBe(0);
      expect(result.message).toBe('Starting household analysis...');
    });

    it('given no reform policy then uses baseline as policy_id', async () => {
      const params = mockHouseholdCalcParams({
        populationId: 'household-abc',
        policyIds: { baseline: 'baseline-id' },
      });
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateHouseholdAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ policy_id: 'baseline-id' })
      );
    });

    it('given null policies then sends null policy_id', async () => {
      const params = mockHouseholdCalcParams({
        policyIds: { baseline: null },
      });
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(mockCreateHouseholdAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ policy_id: null })
      );
    });

    it('given job creation fails then returns error status', async () => {
      const params = mockHouseholdCalcParams();
      mockCreateHouseholdAnalysis.mockRejectedValue(new Error('Job creation failed'));

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'HOUSEHOLD_ANALYSIS_FAILED',
        message: 'Job creation failed',
        retryable: true,
      });
    });
  });

  describe('execute (subsequent calls - polling)', () => {
    beforeEach(async () => {
      // Set up a job in the registry
      const params = mockHouseholdCalcParams();
      mockCreateHouseholdAnalysis.mockResolvedValue(
        mockHouseholdPendingResponse({ report_id: TEST_REPORT_IDS.PENDING })
      );
      await strategy.execute(params, mockMetadata);
      vi.clearAllMocks();
    });

    it('given pending status then returns pending with progress', async () => {
      const params = mockHouseholdCalcParams();
      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Waiting in queue...');
      expect(mockCreateHouseholdAnalysis).not.toHaveBeenCalled();
    });

    it('given running status then returns pending with running message', async () => {
      const params = mockHouseholdCalcParams();
      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdRunningResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Running household analysis...');
    });

    it('given completed status then returns complete with response as result', async () => {
      const params = mockHouseholdCalcParams();
      const completedResponse = mockHouseholdCompletedResponse();
      mockGetHouseholdAnalysis.mockResolvedValue(completedResponse);

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('complete');
      expect(result.result).toEqual(completedResponse);
    });

    it('given failed status then returns error', async () => {
      const params = mockHouseholdCalcParams();
      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdFailedResponse());

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'HOUSEHOLD_ANALYSIS_FAILED',
        message: 'Household analysis calculation error',
        retryable: true,
      });
    });

    it('given failed status with no message then uses default error message', async () => {
      const params = mockHouseholdCalcParams();
      mockGetHouseholdAnalysis.mockResolvedValue(
        mockHouseholdFailedResponse({ error_message: null })
      );

      const result = await strategy.execute(params, mockMetadata);

      expect(result.error?.message).toBe('Household analysis failed');
    });

    it('given single poll error then returns pending to retry', async () => {
      const params = mockHouseholdCalcParams();
      mockGetHouseholdAnalysis.mockRejectedValue(new Error('Network error'));

      const result = await strategy.execute(params, mockMetadata);

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Retrying status check...');
    });

    it('given max consecutive poll errors then returns error status', async () => {
      const params = mockHouseholdCalcParams();
      mockGetHouseholdAnalysis.mockRejectedValue(new Error('Persistent network error'));

      await strategy.execute(params, mockMetadata); // Error 1
      await strategy.execute(params, mockMetadata); // Error 2
      const result = await strategy.execute(params, mockMetadata); // Error 3

      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('POLL_FAILED');
      expect(result.error?.message).toContain('failed after 3 attempts');
      expect(result.error?.message).toContain('Persistent network error');
    });

    it('given successful poll after errors then resets error count', async () => {
      const params = mockHouseholdCalcParams();

      mockGetHouseholdAnalysis
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockHouseholdRunningResponse())
        .mockRejectedValueOnce(new Error('Network error'));

      await strategy.execute(params, mockMetadata); // Error 1
      await strategy.execute(params, mockMetadata); // Error 2
      await strategy.execute(params, mockMetadata); // Success - resets
      const result = await strategy.execute(params, mockMetadata); // Error 1 (reset)

      expect(result.status).toBe('pending');
      expect(result.message).toBe('Retrying status check...');
    });

    it('given pending status then shows synthetic progress based on elapsed time', async () => {
      const params = mockHouseholdCalcParams();
      const metadataWithOldStart: CalcMetadata = {
        ...mockMetadata,
        startedAt: Date.now() - 30000, // Started 30 seconds ago
      };

      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      const result = await strategy.execute(params, metadataWithOldStart);

      expect(result.status).toBe('pending');
      expect(result.progress).toBeDefined();
      // 30s elapsed / 60s estimate = 50%
      expect(result.progress).toBeCloseTo(50, 0);
    });

    it('given long-running calculation then caps progress at 95%', async () => {
      const params = mockHouseholdCalcParams();
      const metadataWithOldStart: CalcMetadata = {
        ...mockMetadata,
        startedAt: Date.now() - 300000, // Started 5 minutes ago
      };

      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      const result = await strategy.execute(params, metadataWithOldStart);

      expect(result.progress).toBe(95);
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

      expect(interval).toBe(1000);
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
      expect(result.metadata.calcType).toBe('household');
      expect(result.metadata.targetType).toBe('simulation');
    });
  });

  describe('job registry management', () => {
    it('given new calculation then has no active job', () => {
      expect(strategy.hasActiveJob('new-calc-id')).toBe(false);
    });

    it('given job created then has active job', async () => {
      const params = mockHouseholdCalcParams();
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());

      await strategy.execute(params, mockMetadata);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(true);
    });

    it('given cleanupJob called then removes job from registry', async () => {
      const params = mockHouseholdCalcParams();
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());
      await strategy.execute(params, mockMetadata);

      strategy.cleanupJob(mockMetadata.calcId);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });

    it('given completed job then removes from registry', async () => {
      const params = mockHouseholdCalcParams();
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());
      await strategy.execute(params, mockMetadata);

      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdCompletedResponse());
      await strategy.execute(params, mockMetadata);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });

    it('given failed job then removes from registry', async () => {
      const params = mockHouseholdCalcParams();
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdPendingResponse());
      await strategy.execute(params, mockMetadata);

      mockGetHouseholdAnalysis.mockResolvedValue(mockHouseholdFailedResponse());
      await strategy.execute(params, mockMetadata);

      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });
  });
});
