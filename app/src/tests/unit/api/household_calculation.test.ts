import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { BASE_URL } from '@/constants';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  mockAbortError,
  mockErrorCalculationResponse,
  mockErrorResponse,
  mockNetworkError,
  mockSuccessfulCalculationResponse,
  mockSuccessResponse,
  mockUKCalculationResponse,
  TEST_COUNTRIES,
  TEST_HOUSEHOLD_IDS,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/householdCalculationMocks';

global.fetch = vi.fn();

describe('household_calculation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('fetchHouseholdCalculation', () => {
    test('given valid parameters then fetches household calculation successfully', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockSuccessfulCalculationResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchHouseholdCalculation(countryId, householdId, policyId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/household/${householdId}/policy/${policyId}`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toEqual(mockSuccessfulCalculationResponse.result);
    });

    test('given UK parameters then returns UK household data', async () => {
      // Given
      const countryId = TEST_COUNTRIES.UK;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockUKCalculationResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchHouseholdCalculation(countryId, householdId, policyId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${countryId}/household/${householdId}/policy/${policyId}`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result.countryId).toBe('uk');
      expect(result).toEqual(mockUKCalculationResponse.result);
    });

    test('given API returns error status then throws error with message', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.INVALID;
      const mockResponse = mockSuccessResponse(mockErrorCalculationResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdCalculation(countryId, householdId, policyId)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_PARAMETERS
      );
    });

    test('given API returns error status with no error message then throws generic error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.INVALID;
      const mockResponse = mockSuccessResponse({
        status: 'error',
        result: null,
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdCalculation(countryId, householdId, policyId)).rejects.toThrow(
        ERROR_MESSAGES.API_ERROR
      );
    });

    test('given API returns HTTP error then throws error with status text', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.NON_EXISTENT;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockErrorResponse(HTTP_STATUS.NOT_FOUND);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdCalculation(countryId, householdId, policyId)).rejects.toThrow(
        ERROR_MESSAGES.CALCULATION_FAILED('Not Found')
      );
    });

    test('given server error then throws error with generic message', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdCalculation(countryId, householdId, policyId)).rejects.toThrow(
        ERROR_MESSAGES.CALCULATION_FAILED('Error')
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      (global.fetch as any).mockRejectedValue(mockNetworkError);

      // When/Then
      await expect(fetchHouseholdCalculation(countryId, householdId, policyId)).rejects.toThrow(
        ERROR_MESSAGES.NETWORK_ERROR
      );
    });

    test('given request times out after 50 seconds then throws timeout error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;

      // Mock fetch to hang indefinitely, allowing the timeout to trigger
      (global.fetch as any).mockImplementation(
        (_url: string, options: any) =>
          new Promise((_, reject) => {
            // Listen for abort signal
            options.signal.addEventListener('abort', () => {
              reject(mockAbortError);
            });
          })
      );

      // When
      const fetchPromise = fetchHouseholdCalculation(countryId, householdId, policyId);

      // Fast-forward timers to trigger timeout
      vi.advanceTimersByTime(50000);

      // Then
      await expect(fetchPromise).rejects.toThrow(ERROR_MESSAGES.TIMEOUT);
    });

    test('given request completes before timeout then returns result', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockSuccessfulCalculationResponse);

      // Mock fetch to resolve after 30 seconds
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 30000);
          })
      );

      // When
      const fetchPromise = fetchHouseholdCalculation(countryId, householdId, policyId);

      // Fast-forward timers but not past timeout
      vi.advanceTimersByTime(30000);

      // Then
      const result = await fetchPromise;
      expect(result).toEqual(mockSuccessfulCalculationResponse.result);
    });

    test('given different countries then constructs correct URLs', async () => {
      // Given
      const countries = Object.values(TEST_COUNTRIES);
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse(mockSuccessfulCalculationResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      for (const country of countries) {
        await fetchHouseholdCalculation(country, householdId, policyId);
      }

      // Then
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `${BASE_URL}/${TEST_COUNTRIES.US}/household/${householdId}/policy/${policyId}`,
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `${BASE_URL}/${TEST_COUNTRIES.UK}/household/${householdId}/policy/${policyId}`,
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        `${BASE_URL}/${TEST_COUNTRIES.CA}/household/${householdId}/policy/${policyId}`,
        expect.any(Object)
      );
    });

    test('given null result with ok status then throws error', async () => {
      // Given
      const countryId = TEST_COUNTRIES.US;
      const householdId = TEST_HOUSEHOLD_IDS.EXISTING;
      const policyId = TEST_POLICY_IDS.BASELINE;
      const mockResponse = mockSuccessResponse({
        status: 'ok',
        result: null,
      });
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdCalculation(countryId, householdId, policyId)).rejects.toThrow(
        ERROR_MESSAGES.API_ERROR
      );
    });
  });
});
