import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createHouseholdAnalysis,
  fromHouseholdImpactResponse,
  getHouseholdAnalysis,
  pollHouseholdAnalysis,
} from '@/api/v2/householdAnalysis';
import {
  createMockHouseholdImpactResponse,
  mockFetch404,
  mockFetchError,
  mockFetchSequence,
  mockFetchSuccess,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('householdAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // fromHouseholdImpactResponse
  // ==========================================================================

  describe('fromHouseholdImpactResponse', () => {
    test('given a response with baseline and reform then simulationIds has both', () => {
      // Given
      const response = createMockHouseholdImpactResponse();

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.id).toBe(TEST_IDS.REPORT_ID);
      expect(report.simulationIds).toEqual(['sim-baseline', 'sim-reform']);
    });

    test('given a response with baseline only (no reform_simulation) then simulationIds has one entry', () => {
      // Given
      const response = {
        ...createMockHouseholdImpactResponse(),
        reform_simulation: null,
      };

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.simulationIds).toEqual(['sim-baseline']);
    });

    test('given a completed response then status maps to "complete"', () => {
      // Given
      const response = createMockHouseholdImpactResponse({ status: 'completed' });

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.status).toBe('complete');
    });

    test('given a failed response then status maps to "error"', () => {
      // Given
      const response = createMockHouseholdImpactResponse({ status: 'failed' });

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.status).toBe('error');
    });

    test('given a pending response then status maps to "pending"', () => {
      // Given
      const response = createMockHouseholdImpactResponse({ status: 'pending' });

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.status).toBe('pending');
    });

    test('given any response then outputType is "household"', () => {
      // Given
      const response = createMockHouseholdImpactResponse();

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.outputType).toBe('household');
    });

    test('given any response then apiVersion is "v2"', () => {
      // Given
      const response = createMockHouseholdImpactResponse();

      // When
      const report = fromHouseholdImpactResponse(response);

      // Then
      expect(report.apiVersion).toBe('v2');
    });
  });

  // ==========================================================================
  // createHouseholdAnalysis
  // ==========================================================================

  describe('createHouseholdAnalysis', () => {
    test('given a successful POST then it returns the response', async () => {
      // Given
      const mockResponse = createMockHouseholdImpactResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createHouseholdAnalysis({
        household_id: TEST_IDS.HOUSEHOLD_ID,
        baseline_policy_id: 'current_law',
        reform_policy_id: TEST_IDS.POLICY_ID,
      });

      // Then
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analysis/household-impact'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    test('given a server error then it throws', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));

      // When / Then
      await expect(
        createHouseholdAnalysis({ household_id: TEST_IDS.HOUSEHOLD_ID })
      ).rejects.toThrow('Failed to create household analysis');
    });
  });

  // ==========================================================================
  // getHouseholdAnalysis
  // ==========================================================================

  describe('getHouseholdAnalysis', () => {
    test('given a successful GET then it returns the response', async () => {
      // Given
      const mockResponse = createMockHouseholdImpactResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await getHouseholdAnalysis(TEST_IDS.REPORT_ID);

      // Then
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/analysis/household-impact/${TEST_IDS.REPORT_ID}`),
        expect.any(Object)
      );
    });

    test('given a 404 response then it throws a not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(getHouseholdAnalysis(TEST_IDS.REPORT_ID)).rejects.toThrow(
        `Household analysis report ${TEST_IDS.REPORT_ID} not found`
      );
    });
  });

  // ==========================================================================
  // pollHouseholdAnalysis
  // ==========================================================================

  describe('pollHouseholdAnalysis', () => {
    test('given analysis completes after polls then it returns the completed response', async () => {
      // Given
      const pendingResponse = createMockHouseholdImpactResponse({ status: 'pending' });
      const completedResponse = createMockHouseholdImpactResponse({ status: 'completed' });
      vi.stubGlobal(
        'fetch',
        mockFetchSequence([
          { ok: true, status: 200, data: pendingResponse },
          { ok: true, status: 200, data: completedResponse },
        ])
      );

      // When
      const result = await pollHouseholdAnalysis(TEST_IDS.REPORT_ID, {
        pollIntervalMs: 10,
        timeoutMs: 5000,
      });

      // Then
      expect(result.status).toBe('completed');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('given analysis fails then it throws with error message', async () => {
      // Given
      const failedResponse = {
        ...createMockHouseholdImpactResponse({ status: 'failed' }),
        error_message: 'Household calculation error',
      };
      vi.stubGlobal('fetch', mockFetchSequence([{ ok: true, status: 200, data: failedResponse }]));

      // When / Then
      await expect(
        pollHouseholdAnalysis(TEST_IDS.REPORT_ID, {
          pollIntervalMs: 10,
          timeoutMs: 5000,
        })
      ).rejects.toThrow('Household calculation error');
    });

    test('given analysis does not complete within timeout then it throws timeout error', async () => {
      // Given
      const pendingResponse = createMockHouseholdImpactResponse({ status: 'pending' });
      vi.stubGlobal('fetch', mockFetchSuccess(pendingResponse));

      // When / Then
      await expect(
        pollHouseholdAnalysis(TEST_IDS.REPORT_ID, {
          timeoutMs: 50,
          pollIntervalMs: 10,
        })
      ).rejects.toThrow('Household analysis timed out');
    });
  });
});
