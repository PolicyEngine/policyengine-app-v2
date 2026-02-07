import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculationResultToHousehold,
  calculateHouseholdV2Alpha,
  createHouseholdCalculationJobV2,
  getHouseholdCalculationJobStatusV2,
  pollHouseholdCalculationJobV2,
} from '@/api/v2/householdCalculation';
import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import {
  API_V2_BASE_URL,
  ERROR_MESSAGES,
  HTTP_STATUS,
  mockErrorResponse,
  mockJobCompletedResponse,
  mockJobCreatedResponse,
  mockJobFailedResponse,
  mockJobPendingResponse,
  mockJobRunningResponse,
  mockSuccessResponse,
  mockV2CalculationResult,
  TEST_JOB_IDS,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/householdCalculationMocks';

describe('v2/householdCalculation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('createHouseholdCalculationJobV2', () => {
    it('given valid payload then creates calculation job', async () => {
      // Given
      const payload = {
        tax_benefit_model_name: 'policyengine_us' as const,
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30, employment_income: 50000 }],
        tax_unit: [{ state_code: 'CA' }],
        household: [{ state_fips: 6 }],
      };
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobCreatedResponse)
      );

      // When
      const result = await createHouseholdCalculationJobV2(payload);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${API_V2_BASE_URL}/household/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result.job_id).toBe(TEST_JOB_IDS.PENDING);
      expect(result.status).toBe('PENDING');
    });

    it('given payload with policy_id then includes policy in request', async () => {
      // Given
      const payload = {
        tax_benefit_model_name: 'policyengine_us' as const,
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
        policy_id: TEST_POLICY_IDS.REFORM,
      };
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobCreatedResponse)
      );

      // When
      await createHouseholdCalculationJobV2(payload);

      // Then
      const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
      expect(body.policy_id).toBe(TEST_POLICY_IDS.REFORM);
    });

    it('given API error then throws error with status', async () => {
      // Given
      const payload = {
        tax_benefit_model_name: 'policyengine_us' as const,
        year: parseInt(CURRENT_YEAR, 10),
        people: [],
      };
      vi.mocked(global.fetch).mockResolvedValue(
        mockErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid payload')
      );

      // When/Then
      await expect(createHouseholdCalculationJobV2(payload)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_JOB_FAILED(HTTP_STATUS.BAD_REQUEST, 'Invalid payload')
      );
    });
  });

  describe('getHouseholdCalculationJobStatusV2', () => {
    it('given valid job ID then returns job status', async () => {
      // Given
      const jobId = TEST_JOB_IDS.COMPLETED;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobCompletedResponse)
      );

      // When
      const result = await getHouseholdCalculationJobStatusV2(jobId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/household/calculate/${jobId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toBeDefined();
    });

    it('given job not found then throws error', async () => {
      // Given
      const jobId = 'nonexistent-job';
      vi.mocked(global.fetch).mockResolvedValue(
        mockErrorResponse(HTTP_STATUS.NOT_FOUND, 'Not found')
      );

      // When/Then
      await expect(getHouseholdCalculationJobStatusV2(jobId)).rejects.toThrow(
        ERROR_MESSAGES.JOB_NOT_FOUND(jobId)
      );
    });

    it('given pending status then returns pending response', async () => {
      // Given
      const jobId = TEST_JOB_IDS.PENDING;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobPendingResponse)
      );

      // When
      const result = await getHouseholdCalculationJobStatusV2(jobId);

      // Then
      expect(result.status).toBe('PENDING');
      expect(result.result).toBeNull();
    });

    it('given failed status then returns error message', async () => {
      // Given
      const jobId = TEST_JOB_IDS.FAILED;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobFailedResponse)
      );

      // When
      const result = await getHouseholdCalculationJobStatusV2(jobId);

      // Then
      expect(result.status).toBe('FAILED');
      expect(result.error_message).toBe(ERROR_MESSAGES.CALCULATION_FAILED);
    });
  });

  describe('pollHouseholdCalculationJobV2', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('given job completes immediately then returns result', async () => {
      // Given
      const jobId = TEST_JOB_IDS.COMPLETED;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobCompletedResponse)
      );

      // When
      const result = await pollHouseholdCalculationJobV2(jobId);

      // Then
      expect(result).toEqual(mockV2CalculationResult);
    });

    it('given job fails then throws error with message', async () => {
      // Given
      const jobId = TEST_JOB_IDS.FAILED;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobFailedResponse)
      );

      // When/Then
      await expect(pollHouseholdCalculationJobV2(jobId)).rejects.toThrow(
        ERROR_MESSAGES.CALCULATION_FAILED
      );
    });

    it('given job completes without result then throws error', async () => {
      // Given
      const jobId = TEST_JOB_IDS.COMPLETED;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse({
          ...mockJobCompletedResponse,
          result: null,
        })
      );

      // When/Then
      await expect(pollHouseholdCalculationJobV2(jobId)).rejects.toThrow(
        ERROR_MESSAGES.NO_RESULT
      );
    });

    it('given job takes multiple polls then waits and returns result', async () => {
      // Given
      const jobId = TEST_JOB_IDS.PENDING;
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve(mockSuccessResponse(mockJobRunningResponse));
        }
        return Promise.resolve(mockSuccessResponse(mockJobCompletedResponse));
      });

      // When
      const pollPromise = pollHouseholdCalculationJobV2(jobId, { pollIntervalMs: 100 });

      // Advance time for 2 poll intervals
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);

      const result = await pollPromise;

      // Then
      expect(callCount).toBe(3);
      expect(result).toEqual(mockV2CalculationResult);
    });

    it('given timeout exceeded then throws timeout error', async () => {
      // Given
      const jobId = TEST_JOB_IDS.PENDING;
      vi.mocked(global.fetch).mockResolvedValue(
        mockSuccessResponse(mockJobPendingResponse)
      );

      // When - start polling with short timeout
      const pollPromise = pollHouseholdCalculationJobV2(jobId, {
        pollIntervalMs: 100,
        timeoutMs: 250,
      });

      // Advance time past timeout and wait for promise to reject
      // We need to handle the rejection in the same tick
      const rejectPromise = expect(pollPromise).rejects.toThrow(
        'Calculation timed out after 4 minutes'
      );

      // Advance time past timeout
      await vi.advanceTimersByTimeAsync(300);

      // Then - verify the rejection
      await rejectPromise;
    });
  });

  describe('calculationResultToHousehold', () => {
    it('given US calculation result then converts to Household format', () => {
      // Given
      const originalHousehold: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
      };

      // When
      const result = calculationResultToHousehold(mockV2CalculationResult, originalHousehold);

      // Then
      expect(result.tax_benefit_model_name).toBe('policyengine_us');
      expect(result.year).toBe(parseInt(CURRENT_YEAR, 10));
      expect(result.people).toEqual(mockV2CalculationResult.person);
      // Extracts first element from arrays
      expect(result.tax_unit).toEqual(mockV2CalculationResult.tax_unit![0]);
      expect(result.household).toEqual(mockV2CalculationResult.household[0]);
    });

    it('given result with null entity then returns undefined', () => {
      // Given
      const originalHousehold: Household = {
        tax_benefit_model_name: 'policyengine_uk',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 35 }],
      };
      const resultWithNulls = {
        ...mockV2CalculationResult,
        tax_unit: null,
        family: null,
      };

      // When
      const result = calculationResultToHousehold(resultWithNulls, originalHousehold);

      // Then
      expect(result.tax_unit).toBeUndefined();
      expect(result.family).toBeUndefined();
    });
  });

  describe('calculateHouseholdV2Alpha', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('given household then creates job, polls, and returns Household', async () => {
      // Given
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30, employment_income: 50000 }],
        tax_unit: { state_code: 'CA' },
        household: { state_fips: 6 },
      };

      // Mock job creation then immediate completion
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation((_url) => {
        callCount++;
        if (callCount === 1) {
          // POST /household/calculate - create job
          return Promise.resolve(mockSuccessResponse(mockJobCreatedResponse));
        }
        // GET /household/calculate/{job_id} - job completed
        return Promise.resolve(mockSuccessResponse(mockJobCompletedResponse));
      });

      // When
      const result = await calculateHouseholdV2Alpha(household);

      // Then
      expect(result.tax_benefit_model_name).toBe('policyengine_us');
      expect(result.people).toEqual(mockV2CalculationResult.person);
      expect(result.tax_unit).toEqual(mockV2CalculationResult.tax_unit![0]);
    });

    it('given household with policyId then includes policy in request', async () => {
      // Given
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
      };
      const policyId = TEST_POLICY_IDS.REFORM;

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockSuccessResponse(mockJobCreatedResponse))
        .mockResolvedValueOnce(mockSuccessResponse(mockJobCompletedResponse));

      // When
      await calculateHouseholdV2Alpha(household, policyId);

      // Then
      const createJobCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(createJobCall[1]?.body as string);
      expect(body.policy_id).toBe(policyId);
    });

    it('given household with dynamicId then includes dynamic in request', async () => {
      // Given
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
      };
      const dynamicId = 'dynamic-uuid';

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockSuccessResponse(mockJobCreatedResponse))
        .mockResolvedValueOnce(mockSuccessResponse(mockJobCompletedResponse));

      // When
      await calculateHouseholdV2Alpha(household, undefined, dynamicId);

      // Then
      const createJobCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(createJobCall[1]?.body as string);
      expect(body.dynamic_id).toBe(dynamicId);
    });
  });
});
