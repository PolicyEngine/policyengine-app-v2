import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  calculationResultToHousehold,
  createHouseholdCalculationJobV2,
  getHouseholdCalculationJobStatusV2,
  pollHouseholdCalculationJobV2,
  type HouseholdCalculatePayload,
  type V2HouseholdShape,
} from '@/api/v2/householdCalculation';
import {
  createMockHouseholdJobResponse,
  createMockHouseholdJobStatusResponse,
  createMockV2HouseholdShape,
  mockFetch404,
  mockFetchError,
  mockFetchSequence,
  mockFetchSuccess,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('householdCalculation v2 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // calculationResultToHousehold
  // ==========================================================================

  describe('calculationResultToHousehold', () => {
    test('given result arrays then maps them to flat household shape', () => {
      // Given
      const result = {
        person: [{ net_income: 45000 }],
        household: [{ total_tax: 5000 }],
        tax_unit: [{ income_tax: 3000 }],
        family: [{ benefits: 200 }],
        spm_unit: [{ poverty_gap: 0 }],
        marital_unit: [{ filing_status: 'single' }],
        benunit: [{ uc_amount: 100 }],
      };
      const original = createMockV2HouseholdShape();

      // When
      const household = calculationResultToHousehold(result, original as V2HouseholdShape);

      // Then
      expect(household.people).toEqual([{ net_income: 45000 }]);
      expect(household.household).toEqual({ total_tax: 5000 });
      expect(household.tax_unit).toEqual({ income_tax: 3000 });
      expect(household.family).toEqual({ benefits: 200 });
      expect(household.spm_unit).toEqual({ poverty_gap: 0 });
      expect(household.marital_unit).toEqual({ filing_status: 'single' });
      expect(household.benunit).toEqual({ uc_amount: 100 });
    });

    test('given result then preserves country_id and year from original household', () => {
      // Given
      const result = {
        person: [{ net_income: 45000 }],
        household: [{ total_tax: 5000 }],
      };
      const original: V2HouseholdShape = {
        country_id: 'uk',
        year: 2025,
        people: [{ age: 40 }],
      };

      // When
      const household = calculationResultToHousehold(result, original);

      // Then
      expect(household.country_id).toBe('uk');
      expect(household.year).toBe(2025);
    });

    test('given null or missing optional arrays then maps to undefined', () => {
      // Given
      const result = {
        person: [{ net_income: 45000 }],
        household: [{ total_tax: 5000 }],
        tax_unit: null,
        family: null,
        spm_unit: null,
        marital_unit: null,
        benunit: null,
      };
      const original = createMockV2HouseholdShape();

      // When
      const household = calculationResultToHousehold(result as any, original as V2HouseholdShape);

      // Then
      expect(household.tax_unit).toBeUndefined();
      expect(household.family).toBeUndefined();
      expect(household.spm_unit).toBeUndefined();
      expect(household.marital_unit).toBeUndefined();
      expect(household.benunit).toBeUndefined();
    });
  });

  // ==========================================================================
  // createHouseholdCalculationJobV2
  // ==========================================================================

  describe('createHouseholdCalculationJobV2', () => {
    test('given valid payload then POST returns job response', async () => {
      // Given
      const payload: HouseholdCalculatePayload = {
        country_id: 'us',
        year: 2026,
        people: [{ age: 30, employment_income: 50000 }],
        tax_unit: { members: ['person1'] },
        family: null,
        spm_unit: null,
        marital_unit: null,
        household: null,
        benunit: null,
      };
      const jobResponse = createMockHouseholdJobResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(jobResponse));

      // When
      const result = await createHouseholdCalculationJobV2(payload);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/household/calculate'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        })
      );
      expect(result.job_id).toBe(TEST_IDS.JOB_ID);
      expect(result.status).toBe('PENDING');
    });

    test('given API returns error then throws with status and message', async () => {
      // Given
      const payload: HouseholdCalculatePayload = {
        country_id: 'us',
        year: 2026,
        people: [{ age: 30 }],
      };
      vi.stubGlobal('fetch', mockFetchError(422, 'Validation error'));

      // When / Then
      await expect(createHouseholdCalculationJobV2(payload)).rejects.toThrow(
        'Failed to create calculation job: 422'
      );
    });
  });

  // ==========================================================================
  // getHouseholdCalculationJobStatusV2
  // ==========================================================================

  describe('getHouseholdCalculationJobStatusV2', () => {
    test('given valid job ID then returns job status', async () => {
      // Given
      const statusResponse = createMockHouseholdJobStatusResponse('COMPLETED');
      vi.stubGlobal('fetch', mockFetchSuccess(statusResponse));

      // When
      const result = await getHouseholdCalculationJobStatusV2(TEST_IDS.JOB_ID);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/household/calculate/${TEST_IDS.JOB_ID}`),
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toBeTruthy();
    });

    test('given 404 response then throws not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(getHouseholdCalculationJobStatusV2(TEST_IDS.JOB_ID)).rejects.toThrow(
        `Calculation job ${TEST_IDS.JOB_ID} not found`
      );
    });
  });

  // ==========================================================================
  // pollHouseholdCalculationJobV2
  // ==========================================================================

  describe('pollHouseholdCalculationJobV2', () => {
    test('given job completes after 2 polls then returns result', async () => {
      // Given
      const pendingResponse = createMockHouseholdJobStatusResponse('PENDING');
      const completedResponse = createMockHouseholdJobStatusResponse('COMPLETED');
      vi.stubGlobal(
        'fetch',
        mockFetchSequence([
          { ok: true, status: 200, data: pendingResponse },
          { ok: true, status: 200, data: completedResponse },
        ])
      );

      // When
      const result = await pollHouseholdCalculationJobV2(TEST_IDS.JOB_ID, {
        timeoutMs: 5000,
        pollIntervalMs: 10,
      });

      // Then
      expect(result).toEqual(completedResponse.result);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('given job fails then throws with error message', async () => {
      // Given
      const failedResponse = createMockHouseholdJobStatusResponse('FAILED');
      vi.stubGlobal('fetch', mockFetchSuccess(failedResponse));

      // When / Then
      await expect(
        pollHouseholdCalculationJobV2(TEST_IDS.JOB_ID, {
          timeoutMs: 5000,
          pollIntervalMs: 10,
        })
      ).rejects.toThrow('Calculation error');
    });

    test('given job never completes then throws timeout error', async () => {
      // Given
      const pendingResponse = createMockHouseholdJobStatusResponse('PENDING');
      vi.stubGlobal('fetch', mockFetchSuccess(pendingResponse));

      // When / Then
      await expect(
        pollHouseholdCalculationJobV2(TEST_IDS.JOB_ID, {
          timeoutMs: 50,
          pollIntervalMs: 10,
        })
      ).rejects.toThrow('Calculation timed out');
    });
  });
});
