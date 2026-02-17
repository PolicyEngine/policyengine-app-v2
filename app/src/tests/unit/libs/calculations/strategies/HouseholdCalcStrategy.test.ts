import { Query } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { HouseholdCalcStrategy } from '@/libs/calculations/strategies/HouseholdCalcStrategy';
import {
  mockV2CalculationResult,
  TEST_JOB_IDS,
} from '@/tests/fixtures/api/householdCalculationMocks';
import { mockHouseholdCalcParams } from '@/tests/fixtures/types/calculationFixtures';
import { CalcMetadata } from '@/types/calculation';
import { Household } from '@/types/ingredients/Household';

// Mock the v2 API modules
vi.mock('@/api/v2/householdCalculation', () => ({
  createHouseholdCalculationJobV2: vi.fn(),
  getHouseholdCalculationJobStatusV2: vi.fn(),
  calculationResultToHousehold: vi.fn(),
}));

vi.mock('@/api/v2/households', () => ({
  fetchHouseholdByIdV2: vi.fn(),
}));

describe('HouseholdCalcStrategy', () => {
  let strategy: HouseholdCalcStrategy;
  let mockCreateJob: any;
  let mockGetJobStatus: any;
  let mockFetchHousehold: any;
  let mockResultToHousehold: any;

  const mockHousehold: Household = {
    tax_benefit_model_name: 'policyengine_us',
    year: parseInt(CURRENT_YEAR, 10),
    people: [{ age: 30, employment_income: 50000 }],
  };

  const mockMetadata: CalcMetadata = {
    calcId: 'test-calc-id',
    calcType: 'household',
    targetType: 'simulation',
    startedAt: Date.now(),
  };

  beforeEach(async () => {
    // Create fresh strategy instance to clear job registry
    strategy = new HouseholdCalcStrategy();

    // Get mock functions from modules
    const householdCalcModule = await import('@/api/v2/householdCalculation');
    const householdsModule = await import('@/api/v2/households');

    mockCreateJob = householdCalcModule.createHouseholdCalculationJobV2;
    mockGetJobStatus = householdCalcModule.getHouseholdCalculationJobStatusV2;
    mockResultToHousehold = householdCalcModule.calculationResultToHousehold;
    mockFetchHousehold = householdsModule.fetchHouseholdByIdV2;

    vi.clearAllMocks();
  });

  describe('execute (first call - job creation)', () => {
    it('given first call then fetches household and creates job', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
      });

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(mockFetchHousehold).toHaveBeenCalledWith(params.populationId);
      expect(mockCreateJob).toHaveBeenCalled();
      expect(result.status).toBe('pending');
      expect(result.progress).toBe(0);
      expect(result.message).toBe('Starting household calculation...');
    });

    it('given reform policy then includes it in job creation', async () => {
      // Given
      const params = mockHouseholdCalcParams({
        policyIds: { baseline: 'baseline-id', reform: 'reform-id' },
      });
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
      });

      // When
      await strategy.execute(params, mockMetadata);

      // Then
      const createJobCall = mockCreateJob.mock.calls[0][0];
      expect(createJobCall.policy_id).toBe('reform-id');
    });

    it('given job creation fails then returns error status', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockRejectedValue(new Error('Job creation failed'));

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'HOUSEHOLD_CALC_FAILED',
        message: 'Job creation failed',
        retryable: true,
      });
    });

    it('given household fetch fails then returns error status', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockRejectedValue(new Error('Household not found'));

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(result.status).toBe('error');
      expect(result.error?.message).toBe('Household not found');
      expect(mockCreateJob).not.toHaveBeenCalled();
    });
  });

  describe('execute (subsequent calls - polling)', () => {
    beforeEach(async () => {
      // Set up a job in the registry first
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
      });
      await strategy.execute(params, mockMetadata);

      // Clear mocks for subsequent call tests
      vi.clearAllMocks();
    });

    it('given pending status then returns pending with progress', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockGetJobStatus.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
        result: null,
        error_message: null,
      });

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Waiting in queue...');
      expect(mockCreateJob).not.toHaveBeenCalled(); // Should not create new job
    });

    it('given running status then returns pending with running message', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockGetJobStatus.mockResolvedValue({
        job_id: TEST_JOB_IDS.RUNNING,
        status: 'RUNNING',
        result: null,
        error_message: null,
      });

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Running household calculation...');
    });

    it('given completed status then returns complete with result', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      const convertedResult = { ...mockHousehold, household: { net_income: 42000 } };
      mockGetJobStatus.mockResolvedValue({
        job_id: TEST_JOB_IDS.COMPLETED,
        status: 'COMPLETED',
        result: mockV2CalculationResult,
        error_message: null,
      });
      mockResultToHousehold.mockReturnValue(convertedResult);

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toEqual(convertedResult);
      expect(mockResultToHousehold).toHaveBeenCalledWith(
        mockV2CalculationResult,
        expect.objectContaining({
          tax_benefit_model_name: 'policyengine_us',
        })
      );
    });

    it('given failed status then returns error', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockGetJobStatus.mockResolvedValue({
        job_id: TEST_JOB_IDS.FAILED,
        status: 'FAILED',
        result: null,
        error_message: 'Calculation error occurred',
      });

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      expect(result.status).toBe('error');
      expect(result.error).toEqual({
        code: 'HOUSEHOLD_CALC_FAILED',
        message: 'Calculation error occurred',
        retryable: true,
      });
    });

    it('given single poll error then returns pending to retry', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockGetJobStatus.mockRejectedValue(new Error('Network error'));

      // When
      const result = await strategy.execute(params, mockMetadata);

      // Then
      // Should return pending (not error) to allow retry
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Retrying status check...');
    });

    it('given max consecutive poll errors then returns error status', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockGetJobStatus.mockRejectedValue(new Error('Persistent network error'));

      // When - execute 3 times (MAX_CONSECUTIVE_ERRORS)
      await strategy.execute(params, mockMetadata); // Error 1
      await strategy.execute(params, mockMetadata); // Error 2
      const result = await strategy.execute(params, mockMetadata); // Error 3 - should fail

      // Then
      expect(result.status).toBe('error');
      expect(result.error?.code).toBe('POLL_FAILED');
      expect(result.error?.message).toContain('failed after 3 attempts');
      expect(result.error?.message).toContain('Persistent network error');
    });

    it('given successful poll after errors then resets error count', async () => {
      // Given
      const params = mockHouseholdCalcParams();

      // First two calls fail
      mockGetJobStatus
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        // Third call succeeds
        .mockResolvedValueOnce({
          job_id: TEST_JOB_IDS.RUNNING,
          status: 'RUNNING',
          result: null,
          error_message: null,
        })
        // Fourth call fails again (should be error count 1, not 3)
        .mockRejectedValueOnce(new Error('Network error'));

      // When
      await strategy.execute(params, mockMetadata); // Error 1
      await strategy.execute(params, mockMetadata); // Error 2
      await strategy.execute(params, mockMetadata); // Success - resets count
      const result = await strategy.execute(params, mockMetadata); // Error 1 (reset)

      // Then - should still be pending, not error (count was reset)
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Retrying status check...');
    });
  });

  describe('getRefetchConfig', () => {
    it('given pending status then returns 1 second poll interval', () => {
      // Given
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: { status: 'pending' } },
      } as unknown as Query;

      // When
      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      // Then
      expect(interval).toBe(1000);
    });

    it('given complete status then returns false (stop polling)', () => {
      // Given
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: { status: 'complete' } },
      } as unknown as Query;

      // When
      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      // Then
      expect(interval).toBe(false);
    });

    it('given error status then returns false (stop polling)', () => {
      // Given
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: { status: 'error' } },
      } as unknown as Query;

      // When
      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      // Then
      expect(interval).toBe(false);
    });

    it('given no data then returns false', () => {
      // Given
      const config = strategy.getRefetchConfig();
      const mockQuery = {
        state: { data: undefined },
      } as unknown as Query;

      // When
      const interval =
        typeof config.refetchInterval === 'function'
          ? config.refetchInterval(mockQuery)
          : config.refetchInterval;

      // Then
      expect(interval).toBe(false);
    });

    it('given config then returns infinite stale time', () => {
      // When
      const config = strategy.getRefetchConfig();

      // Then
      expect(config.staleTime).toBe(Infinity);
    });
  });

  describe('transformResponse', () => {
    it('given household data then transforms to complete CalcStatus', () => {
      // Given
      const householdData = mockHousehold;

      // When
      const result = strategy.transformResponse(householdData);

      // Then
      expect(result.status).toBe('complete');
      expect(result.result).toEqual(householdData);
      expect(result.metadata.calcType).toBe('household');
      expect(result.metadata.targetType).toBe('simulation');
    });
  });

  describe('job registry management', () => {
    it('given new calculation then has no active job', () => {
      // When
      const hasJob = strategy.hasActiveJob('new-calc-id');

      // Then
      expect(hasJob).toBe(false);
    });

    it('given job created then has active job', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
      });

      // When
      await strategy.execute(params, mockMetadata);

      // Then
      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(true);
    });

    it('given cleanupJob called then removes job from registry', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
      });
      await strategy.execute(params, mockMetadata);

      // When
      strategy.cleanupJob(mockMetadata.calcId);

      // Then
      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });

    it('given completed job then removes from registry', async () => {
      // Given
      const params = mockHouseholdCalcParams();
      mockFetchHousehold.mockResolvedValue(mockHousehold);
      mockCreateJob.mockResolvedValue({
        job_id: TEST_JOB_IDS.PENDING,
        status: 'PENDING',
      });
      await strategy.execute(params, mockMetadata);

      mockGetJobStatus.mockResolvedValue({
        job_id: TEST_JOB_IDS.COMPLETED,
        status: 'COMPLETED',
        result: mockV2CalculationResult,
        error_message: null,
      });
      mockResultToHousehold.mockReturnValue(mockHousehold);

      // When
      await strategy.execute(params, mockMetadata);

      // Then
      expect(strategy.hasActiveJob(mockMetadata.calcId)).toBe(false);
    });
  });
});
