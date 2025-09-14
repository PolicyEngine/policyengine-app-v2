import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchEconomyCalculation } from '@/api/economy';
import { BASE_URL } from '@/constants';
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
  TEST_REGIONS,
} from '@/tests/fixtures/api/economyMocks';

global.fetch = vi.fn();

describe('economy API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchEconomyCalculation', () => {
    test('given valid parameters then fetches economy calculation successfully', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: TEST_REGIONS.ENHANCED_US };
      const mockResponse = mockSuccessResponse(mockCompletedResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchEconomyCalculation(
        countryId,
        reformPolicyId,
        baselinePolicyId,
        params
      );

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}?region=${TEST_REGIONS.ENHANCED_US}`
      );
      expect(result).toEqual(mockCompletedResponse);
    });

    test('given no params then constructs URL without query string', async () => {
      // Given
      const countryId = TEST_COUNTRIES.UK;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}`
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
      const result = await fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId);

      // Then
      expect(result.status).toBe('pending');
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
      const result = await fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId);

      // Then
      expect(result.status).toBe('completed');
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
      const result = await fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId);

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
      await expect(
        fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId)
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
      await expect(
        fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId)
      ).rejects.toThrow(ERROR_MESSAGES.CALCULATION_FAILED('Error'));
    });

    test('given network error then propagates error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      (global.fetch as any).mockRejectedValue(mockNetworkError);

      // When/Then
      await expect(
        fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId)
      ).rejects.toThrow(ERROR_MESSAGES.NETWORK_ERROR);
    });

    test('given params with undefined region then excludes from query string', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const reformPolicyId = TEST_POLICY_IDS.REFORM;
      const baselinePolicyId = TEST_POLICY_IDS.BASELINE;
      const params = { region: undefined };
      const mockResponse = mockSuccessResponse(mockPendingResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchEconomyCalculation(countryId, reformPolicyId, baselinePolicyId, params);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}`
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
      for (const country of countries) {
        await fetchEconomyCalculation(country, reformPolicyId, baselinePolicyId);
      }

      // Then
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `${BASE_URL}/${TEST_COUNTRIES.US}/economy/${reformPolicyId}/over/${baselinePolicyId}`
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `${BASE_URL}/${TEST_COUNTRIES.UK}/economy/${reformPolicyId}/over/${baselinePolicyId}`
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        `${BASE_URL}/${TEST_COUNTRIES.CA}/economy/${reformPolicyId}/over/${baselinePolicyId}`
      );
    });
  });
});
