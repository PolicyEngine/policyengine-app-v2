import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { hasUKLocalAreaImpacts } from '@/adapters/societyWideOutputNormalizer';
import {
  fetchLocalAreaBreakdown,
  fetchSocietyWideCalculation,
  isLocalAreaBreakdown,
} from '@/api/societyWideCalculation';
import { BASE_URL, CURRENT_YEAR } from '@/constants';
import {
  EXPECTED_BY_CONSTITUENCY,
  EXPECTED_BY_LOCAL_AUTHORITY,
  LIST_SHAPE_UK_RESULT,
} from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';
import {
  BREAKDOWN_BODY_WITHOUT_BUNDLE_VERSIONS,
  BREAKDOWN_ERROR_RESPONSE,
  BREAKDOWN_OK_RESPONSE,
  BREAKDOWN_PROVENANCE,
  BREAKDOWN_REFUSED_BODY,
  BREAKDOWN_REFUSED_MESSAGE,
  BREAKDOWN_REGION_SCOTLAND,
  BREAKDOWN_REGION_UK,
  BREAKDOWN_RELEASE_BUNDLE,
  BREAKDOWN_YEAR,
  EMPTY_BREAKDOWN_RESULT,
  EXPECTED_BREAKDOWN_WITH_BUNDLE,
  mockErrorResponseWithBody,
  NATIONAL_UK_BODY_FROM_BREAKDOWN_RELEASE,
  NATIONAL_UK_RESULT_WITH_NULL_AREAS,
  NATIONAL_UK_RESULT_WITHOUT_AREA_KEYS,
  OLDER_RELEASE_BUNDLE,
  OLDER_UK_BODY_WITH_AREAS,
  PLAIN_TEXT_ERROR_BODY,
} from '@/tests/fixtures/api/localAreaBreakdownMocks';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  mockCompletedResponse,
  mockCompletedResponseWithBundleBesideResult,
  mockCompletedResponseWithBundleInResult,
  mockErrorCalculationResponse,
  mockErrorResponse,
  mockNetworkError,
  mockPendingResponse,
  mockSuccessResponse,
  mockUSPolicyEngineBundle,
  TEST_COUNTRIES,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/societyWideMocks';
import {
  LEGACY_NORTHERN_IRELAND_REGION_CODE,
  NORTHERN_IRELAND_REGION_CODE,
} from '@/tests/fixtures/models/regionMocks';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';

global.fetch = vi.fn();

describe('societyWide API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSocietyWideCalculation', () => {
    test('given valid parameters then fetches society-wide calculation successfully', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockCompletedResponse);
    });

    test('given minimal params then constructs URL with required params', async () => {
      // Given
      const countryId = TEST_COUNTRIES.UK;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'uk', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=uk&time_period=${CURRENT_YEAR}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockPendingResponse);
    });

    test('given pending status then returns queue position and average time', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(result.status).toBe('computing');
      expect(result.queue_position).toBe(5);
      expect(result.average_time).toBe(120);
      expect(result.result).toBeNull();
    });

    test('given completed status then returns calculation result', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(result.status).toBe('ok');
      expect(result.result).toBeDefined();
      expect(result.result?.budget.budgetary_impact).toBe(75000);
    });

    test.each([
      ['inside the result, as the Public API returns it', mockCompletedResponseWithBundleInResult],
      ['beside the result', mockCompletedResponseWithBundleBesideResult],
    ])(
      'given completed status with the policyengine bundle %s then merges the bundle into the result',
      async (_label, body) => {
        // Given
        (global.fetch as any).mockResolvedValue(mockSuccessResponse(body));

        // When
        const response = await fetchSocietyWideCalculation(
          TEST_COUNTRIES.US,
          TEST_POLICY_IDS.REFORM,
          TEST_POLICY_IDS.BASELINE,
          { region: 'us', time_period: CURRENT_YEAR }
        );

        // Then
        expect(response.result).toMatchObject(mockUSPolicyEngineBundle);
      }
    );

    test('given the Public API body for a .py 6.10.0 national UK result then the result gets the bundle versions and dataset', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(
        mockSuccessResponse(NATIONAL_UK_BODY_FROM_BREAKDOWN_RELEASE)
      );

      // When
      const response = await fetchSocietyWideCalculation(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(response.result).toMatchObject(BREAKDOWN_RELEASE_BUNDLE);
      expect(response.result?.policyengine_bundle).toEqual(BREAKDOWN_RELEASE_BUNDLE);
      expect(hasUKLocalAreaImpacts(response.result)).toBe(false);
    });

    test('given the Public API body for a .py 6.7.5 UK result with area data then the result gets .py 6.7.5 and keeps its areas', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(OLDER_UK_BODY_WITH_AREAS));

      // When
      const response = await fetchSocietyWideCalculation(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(response.result).toMatchObject(OLDER_RELEASE_BUNDLE);
      expect(hasUKLocalAreaImpacts(response.result)).toBe(true);
    });

    test('given error status then returns error message with null result', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockErrorCalculationResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      const result = await fetchSocietyWideCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(result.status).toBe('error');
      expect(result.result).toBeNull();
      expect(result.error).toBe('Calculation failed due to invalid parameters');
    });

    test('given API returns HTTP error then throws error with status text', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.INVALID;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockErrorResponse(HTTP_STATUS.NOT_FOUND);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      const params = { region: 'us', time_period: CURRENT_YEAR };
      await expect(
        fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params)
      ).rejects.toThrow(ERROR_MESSAGES.CALCULATION_FAILED(HTTP_STATUS.NOT_FOUND, 'Not Found'));
    });

    test('given server error then throws generic error message', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      const params = { region: 'us', time_period: CURRENT_YEAR };
      await expect(
        fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params)
      ).rejects.toThrow(
        ERROR_MESSAGES.CALCULATION_FAILED(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Error')
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      (global.fetch as any).mockRejectedValue(mockNetworkError);

      // When/Then
      const params = { region: 'us', time_period: CURRENT_YEAR };
      await expect(
        fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params)
      ).rejects.toThrow(ERROR_MESSAGES.NETWORK_ERROR);
    });

    test('given params with undefined values then excludes them from query string', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: undefined, time_period: CURRENT_YEAR } as any;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?time_period=${CURRENT_YEAR}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    test('given different countries then constructs correct URLs', async () => {
      // Given
      const countries = Object.values(TEST_COUNTRIES);
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const params = { region: 'us', time_period: CURRENT_YEAR };
      for (const country of countries) {
        await fetchSocietyWideCalculation(country, reformPolicyId, baselinePolicyId, params);
      }

      // Then - all countries use the same URL format (backend handles dataset selection)
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `${BASE_URL}/${TEST_COUNTRIES.US}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `${BASE_URL}/${TEST_COUNTRIES.UK}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        `${BASE_URL}/${TEST_COUNTRIES.CA}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given US state-level params then omits deprecated district breakdown query', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'state/ca', time_period: CURRENT_YEAR };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=state%2Fca&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect((global.fetch as any).mock.calls[0][0]).not.toContain('include_district_breakdowns');
    });

    test('given stale dataset parameter then omits it from the URL', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: 'us', time_period: CURRENT_YEAR, dataset: 'custom_dataset' };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchSocietyWideCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('given a UK result with list-shape area impacts then returns them keyed by name', async () => {
      // Given
      const params = { region: 'uk', time_period: CURRENT_YEAR };
      (global.fetch as any).mockResolvedValue(
        mockSuccessResponse({ status: 'ok', result: LIST_SHAPE_UK_RESULT })
      );

      // When
      const response = await fetchSocietyWideCalculation(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        params
      );

      // Then
      const result = response.result as any;
      expect(result.constituency_impact).toEqual({ by_constituency: EXPECTED_BY_CONSTITUENCY });
      expect(result.local_authority_impact).toEqual({
        by_local_authority: EXPECTED_BY_LOCAL_AUTHORITY,
      });
    });

    test('given a breakdown passed to the national request anyway then it is not sent', async () => {
      // Given
      const params = {
        region: BREAKDOWN_REGION_UK,
        time_period: BREAKDOWN_YEAR,
        breakdown: 'local_areas',
      } as any;
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(mockPendingResponse));

      // When
      await fetchSocietyWideCalculation(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        params
      );

      // Then
      expect((global.fetch as any).mock.calls[0][0]).toBe(
        `${BASE_URL}/${TEST_COUNTRIES.UK}/economy/${TEST_POLICY_IDS.REFORM}/over/${TEST_POLICY_IDS.BASELINE}?region=uk&time_period=${BREAKDOWN_YEAR}`
      );
    });

    test('given no breakdown requested then the URL has no breakdown parameter', async () => {
      // Given
      const params = { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR };
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(mockPendingResponse));

      // When
      await fetchSocietyWideCalculation(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        params
      );

      // Then
      expect((global.fetch as any).mock.calls[0][0]).not.toContain('breakdown');
    });

    test.each([
      ['absent', NATIONAL_UK_RESULT_WITHOUT_AREA_KEYS],
      ['null', NATIONAL_UK_RESULT_WITH_NULL_AREAS],
    ])(
      'given a national UK result whose area impacts are %s then it has no area data',
      async (_label, nationalResult) => {
        // Given
        (global.fetch as any).mockResolvedValue(
          mockSuccessResponse({ status: 'ok', result: nationalResult })
        );

        // When
        const response = await fetchSocietyWideCalculation(
          TEST_COUNTRIES.UK,
          TEST_POLICY_IDS.REFORM,
          TEST_POLICY_IDS.BASELINE,
          { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
        );

        // Then
        expect(response.status).toBe('ok');
        expect(response.result?.budget).toEqual(nationalResult.budget);
        expect(hasUKLocalAreaImpacts(response.result)).toBe(false);
      }
    );

    test('given a UK result with area impacts then it has area data', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(
        mockSuccessResponse({ status: 'ok', result: LIST_SHAPE_UK_RESULT })
      );

      // When
      const response = await fetchSocietyWideCalculation(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(hasUKLocalAreaImpacts(response.result)).toBe(true);
    });
  });

  describe('fetchLocalAreaBreakdown', () => {
    test('given a UK-wide report then sends breakdown=local_areas after the region and year', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(mockPendingResponse));

      // When
      await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect((global.fetch as any).mock.calls[0][0]).toBe(
        `${BASE_URL}/${TEST_COUNTRIES.UK}/economy/${TEST_POLICY_IDS.REFORM}/over/${TEST_POLICY_IDS.BASELINE}?region=uk&time_period=${BREAKDOWN_YEAR}&breakdown=local_areas`
      );
    });

    test('given a nation report then asks the economy endpoint for its local-area breakdown', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(mockPendingResponse));

      // When
      await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_SCOTLAND, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${TEST_COUNTRIES.UK}/economy/${TEST_POLICY_IDS.REFORM}/over/${TEST_POLICY_IDS.BASELINE}?region=country%2Fscotland&time_period=${BREAKDOWN_YEAR}&breakdown=local_areas`,
        { headers: { 'Content-Type': 'application/json' } }
      );
    });

    test('given a breakdown request then never sends dataset or include_district_breakdowns', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(mockPendingResponse));

      // When
      await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        {
          region: BREAKDOWN_REGION_UK,
          time_period: BREAKDOWN_YEAR,
          dataset: 'microcosm_uk_2024_25_dense',
          include_district_breakdowns: true,
        } as any
      );

      // Then
      const url = (global.fetch as any).mock.calls[0][0] as string;
      expect(url).not.toContain('dataset');
      expect(url).not.toContain('include_district_breakdowns');
    });

    test('given a completed breakdown then returns its lists keyed by area name', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(BREAKDOWN_OK_RESPONSE));

      // When
      const response = await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(response.status).toBe('ok');
      expect(response.result).toEqual(EXPECTED_BREAKDOWN_WITH_BUNDLE);
    });

    test('given a bundle without versions then the breakdown keeps its own versions', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(
        mockSuccessResponse(BREAKDOWN_BODY_WITHOUT_BUNDLE_VERSIONS)
      );

      // When
      const response = await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(response.result).toMatchObject({
        model_version: BREAKDOWN_PROVENANCE.model_version,
        policyengine_version: BREAKDOWN_PROVENANCE.policyengine_version,
      });
    });

    test('given every area withheld then returns empty maps for both levels', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(
        mockSuccessResponse({ status: 'ok', result: EMPTY_BREAKDOWN_RESULT })
      );

      // When
      const response = await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      const result = response.result!;
      expect(isLocalAreaBreakdown(result)).toBe(true);
      const breakdown = result as LocalAreaBreakdown;
      expect(breakdown.constituency_impact).toEqual({ by_constituency: {} });
      expect(breakdown.local_authority_impact).toEqual({ by_local_authority: {} });
    });

    test('given a failed breakdown then returns the error envelope', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(BREAKDOWN_ERROR_RESPONSE));

      // When
      const response = await fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      expect(response.status).toBe('error');
      expect(response.error).toBe(BREAKDOWN_ERROR_RESPONSE.error);
      expect(response.result).toBeNull();
    });

    test('given the API refuses the breakdown with a message then the error names the breakdown and gives the message', async () => {
      // Given
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockResolvedValue(
        mockErrorResponseWithBody(HTTP_STATUS.BAD_REQUEST, 'Bad Request', BREAKDOWN_REFUSED_BODY)
      );

      // When
      const request = fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      await expect(request).rejects.toThrow(
        `Local-area breakdown failed (400): ${BREAKDOWN_REFUSED_MESSAGE}`
      );
      expect(consoleError.mock.calls[0][0]).toBe('[fetchLocalAreaBreakdown] 400 Bad Request');
    });

    test('given an error body that is not JSON then the breakdown error gives the body', async () => {
      // Given
      vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockResolvedValue(
        mockErrorResponseWithBody(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Internal Server Error',
          PLAIN_TEXT_ERROR_BODY
        )
      );

      // When
      const request = fetchLocalAreaBreakdown(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
      );

      // Then
      await expect(request).rejects.toThrow(
        `Local-area breakdown failed (500): ${PLAIN_TEXT_ERROR_BODY}`
      );
    });
  });
});

describe('societyWide API Northern Ireland region', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given a national request for country/ni then it asks for country/northern_ireland', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValue(mockSuccessResponse(mockPendingResponse) as any);

    // When
    await fetchSocietyWideCalculation(
      TEST_COUNTRIES.UK,
      TEST_POLICY_IDS.REFORM,
      TEST_POLICY_IDS.BASELINE,
      { region: LEGACY_NORTHERN_IRELAND_REGION_CODE, time_period: CURRENT_YEAR }
    );

    // Then
    const requestUrl = new URL(String(mockFetch.mock.calls[0][0]));
    expect(requestUrl.searchParams.get('region')).toBe(NORTHERN_IRELAND_REGION_CODE);
  });

  test('given a local-area breakdown for country/ni then it asks for country/northern_ireland', async () => {
    // Given
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValue(mockSuccessResponse(mockPendingResponse) as any);

    // When
    await fetchLocalAreaBreakdown(
      TEST_COUNTRIES.UK,
      TEST_POLICY_IDS.REFORM,
      TEST_POLICY_IDS.BASELINE,
      { region: LEGACY_NORTHERN_IRELAND_REGION_CODE, time_period: CURRENT_YEAR }
    );

    // Then
    const requestUrl = new URL(String(mockFetch.mock.calls[0][0]));
    expect(requestUrl.searchParams.get('region')).toBe(NORTHERN_IRELAND_REGION_CODE);
  });
});
