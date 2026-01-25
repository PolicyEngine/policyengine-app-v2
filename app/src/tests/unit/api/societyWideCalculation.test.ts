import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchSocietyWideCalculation } from '@/api/societyWideCalculation';
import { BASE_URL, CURRENT_YEAR } from '@/constants';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  mockCompletedResponse,
  mockErrorCalculationResponse,
  mockErrorResponse,
  mockNetworkError,
  mockPendingResponse,
  mockSuccessResponse,
  TEST_COUNTRIES,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/societyWideMocks';

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
      ).rejects.toThrow(ERROR_MESSAGES.CALCULATION_FAILED('Not Found'));
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
      ).rejects.toThrow(ERROR_MESSAGES.CALCULATION_FAILED('Error'));
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

    test('given explicit dataset parameter then includes it in URL', async () => {
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
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=us&time_period=${CURRENT_YEAR}&dataset=custom_dataset`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });
});
