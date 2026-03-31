import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createEconomyAnalysis,
  createEconomyCustomAnalysis,
  fromEconomicImpactResponse,
  getEconomyAnalysis,
  getEconomyCustomAnalysis,
  pollEconomyAnalysis,
} from '@/api/v2/economyAnalysis';
import {
  createMockEconomicImpactResponse,
  mockFetch404,
  mockFetchError,
  mockFetchSequence,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('economyAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // fromEconomicImpactResponse
  // ==========================================================================

  describe('fromEconomicImpactResponse', () => {
    test('given a completed response then it returns a Report with correct id and simulationIds', () => {
      // Given
      const response = createMockEconomicImpactResponse({ status: 'completed' });

      // When
      const report = fromEconomicImpactResponse(response, 'us', '2026');

      // Then
      expect(report.id).toBe(TEST_IDS.REPORT_ID);
      expect(report.simulationIds).toEqual(['sim-baseline', 'sim-reform']);
    });

    test('given a completed response then status maps to "complete"', () => {
      // Given
      const response = createMockEconomicImpactResponse({ status: 'completed' });

      // When
      const report = fromEconomicImpactResponse(response, 'us', '2026');

      // Then
      expect(report.status).toBe('complete');
    });

    test('given a failed response then status maps to "error"', () => {
      // Given
      const response = createMockEconomicImpactResponse({ status: 'failed' });

      // When
      const report = fromEconomicImpactResponse(response, 'us', '2026');

      // Then
      expect(report.status).toBe('error');
    });

    test('given a pending response then status maps to "pending"', () => {
      // Given
      const response = createMockEconomicImpactResponse({ status: 'pending' });

      // When
      const report = fromEconomicImpactResponse(response, 'us', '2026');

      // Then
      expect(report.status).toBe('pending');
    });

    test('given any response then outputType is "economy"', () => {
      // Given
      const response = createMockEconomicImpactResponse();

      // When
      const report = fromEconomicImpactResponse(response, 'us', '2026');

      // Then
      expect(report.outputType).toBe('economy');
    });

    test('given any response then apiVersion is "v2"', () => {
      // Given
      const response = createMockEconomicImpactResponse();

      // When
      const report = fromEconomicImpactResponse(response, 'us', '2026');

      // Then
      expect(report.apiVersion).toBe('v2');
    });
  });

  // ==========================================================================
  // createEconomyAnalysis
  // ==========================================================================

  describe('createEconomyAnalysis', () => {
    test('given a successful POST then it returns the response', async () => {
      // Given
      const mockResponse = createMockEconomicImpactResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createEconomyAnalysis({
        country_id: TEST_COUNTRY_ID,
        region: 'state/ca',
      });

      // Then
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analysis/economic-impact'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    test('given a server error then it throws', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));

      // When / Then
      await expect(createEconomyAnalysis({ country_id: TEST_COUNTRY_ID })).rejects.toThrow(
        'createEconomyAnalysis: 500 Internal Server Error'
      );
    });
  });

  // ==========================================================================
  // getEconomyAnalysis
  // ==========================================================================

  describe('getEconomyAnalysis', () => {
    test('given a successful GET then it returns the response', async () => {
      // Given
      const mockResponse = createMockEconomicImpactResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await getEconomyAnalysis(TEST_IDS.REPORT_ID);

      // Then
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/analysis/economic-impact/${TEST_IDS.REPORT_ID}`),
        expect.any(Object)
      );
    });

    test('given a 404 response then it throws a not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(getEconomyAnalysis(TEST_IDS.REPORT_ID)).rejects.toThrow(
        'getEconomyAnalysis: 404 Not found'
      );
    });
  });

  // ==========================================================================
  // pollEconomyAnalysis
  // ==========================================================================

  describe('pollEconomyAnalysis', () => {
    test('given analysis completes after polls then it returns the completed response', async () => {
      // Given
      const pendingResponse = createMockEconomicImpactResponse({ status: 'pending' });
      const completedResponse = createMockEconomicImpactResponse({ status: 'completed' });
      vi.stubGlobal(
        'fetch',
        mockFetchSequence([
          { ok: true, status: 200, data: pendingResponse },
          { ok: true, status: 200, data: completedResponse },
        ])
      );

      // When
      const result = await pollEconomyAnalysis(TEST_IDS.REPORT_ID, {
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
        ...createMockEconomicImpactResponse({ status: 'failed' }),
        error_message: 'Simulation diverged',
      };
      vi.stubGlobal('fetch', mockFetchSequence([{ ok: true, status: 200, data: failedResponse }]));

      // When / Then
      await expect(
        pollEconomyAnalysis(TEST_IDS.REPORT_ID, {
          pollIntervalMs: 10,
          timeoutMs: 5000,
        })
      ).rejects.toThrow('Simulation diverged');
    });

    test('given analysis does not complete within timeout then it throws timeout error', async () => {
      // Given
      const pendingResponse = createMockEconomicImpactResponse({ status: 'pending' });
      vi.stubGlobal('fetch', mockFetchSuccess(pendingResponse));

      // When / Then
      await expect(
        pollEconomyAnalysis(TEST_IDS.REPORT_ID, {
          timeoutMs: 50,
          pollIntervalMs: 10,
        })
      ).rejects.toThrow('Economy analysis timed out');
    });
  });

  // ==========================================================================
  // createEconomyCustomAnalysis
  // ==========================================================================

  describe('createEconomyCustomAnalysis', () => {
    test('given a successful POST then it returns the response', async () => {
      // Given
      const mockResponse = createMockEconomicImpactResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createEconomyCustomAnalysis({
        country_id: TEST_COUNTRY_ID,
        modules: ['decile_impacts', 'poverty'],
      });

      // Then
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analysis/economy-custom'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ==========================================================================
  // getEconomyCustomAnalysis
  // ==========================================================================

  describe('getEconomyCustomAnalysis', () => {
    test('given a successful GET then it returns the response with modules param', async () => {
      // Given
      const mockResponse = createMockEconomicImpactResponse();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));
      const modules = ['decile_impacts', 'poverty'];

      // When
      const result = await getEconomyCustomAnalysis(TEST_IDS.REPORT_ID, modules);

      // Then
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`modules=${encodeURIComponent(modules.join(','))}`),
        expect.any(Object)
      );
    });

    test('given a 404 response then it throws a not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(
        getEconomyCustomAnalysis(TEST_IDS.REPORT_ID, ['decile_impacts'])
      ).rejects.toThrow('getEconomyCustomAnalysis: 404 Not found');
    });
  });
});
