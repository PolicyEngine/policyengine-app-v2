import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHouseholdById, createHousehold } from '@/api/household';
import { BASE_URL } from '@/constants';
import {
  EXISTING_HOUSEHOLD_ID,
  NON_EXISTENT_HOUSEHOLD_ID,
  TEST_COUNTRIES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  mockHouseholdMetadata,
  mockHouseholdCreationPayload,
  mockHouseholdCreationPayloadUK,
  mockLargeHouseholdPayload,
  mockCreateHouseholdResponse,
  mockSuccessResponse,
  mockErrorResponse,
  mockNetworkError,
  mockFetchError,
} from '@/tests/fixtures/api/householdMocks';

global.fetch = vi.fn();

describe('household API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchHouseholdById', () => {
    test('given valid household ID then fetches household metadata successfully', async () => {
      // Given
      const country = TEST_COUNTRIES.US;
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockSuccessResponse({ result: mockHouseholdMetadata });
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchHouseholdById(country, householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${country}/household/${householdId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      expect(result).toEqual(mockHouseholdMetadata);
    });

    test('given API returns error then throws error with household ID', async () => {
      // Given
      const country = TEST_COUNTRIES.UK;
      const householdId = NON_EXISTENT_HOUSEHOLD_ID;
      const mockResponse = mockErrorResponse(HTTP_STATUS.NOT_FOUND);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdById(country, householdId)).rejects.toThrow(
        ERROR_MESSAGES.FETCH_HOUSEHOLD_FAILED(householdId)
      );
    });

    test('given different country codes then constructs correct URL', async () => {
      // Given
      const countries = Object.values(TEST_COUNTRIES);
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockSuccessResponse({ result: mockHouseholdMetadata });
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      for (const country of countries) {
        await fetchHouseholdById(country, householdId);
      }

      // Then
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        `${BASE_URL}/${TEST_COUNTRIES.US}/household/${householdId}`,
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        `${BASE_URL}/${TEST_COUNTRIES.UK}/household/${householdId}`,
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        `${BASE_URL}/${TEST_COUNTRIES.CA}/household/${householdId}`,
        expect.any(Object)
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      const country = TEST_COUNTRIES.US;
      const householdId = EXISTING_HOUSEHOLD_ID;
      (global.fetch as any).mockRejectedValue(mockNetworkError);

      // When/Then
      await expect(fetchHouseholdById(country, householdId)).rejects.toThrow(ERROR_MESSAGES.NETWORK_ERROR);
    });
  });

  describe('createHousehold', () => {
    test('given valid household data then creates household successfully', async () => {
      // Given
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockCreateHouseholdResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await createHousehold(mockHouseholdCreationPayload);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${mockHouseholdCreationPayload.country_id}/household`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockHouseholdCreationPayload),
        }
      );
      expect(result).toEqual(mockCreateHouseholdResponse);
    });

    test('given API returns error then throws error', async () => {
      // Given
      const mockResponse = mockErrorResponse(HTTP_STATUS.BAD_REQUEST);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(createHousehold(mockHouseholdCreationPayload)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_HOUSEHOLD_FAILED
      );
    });

    test('given different country in payload then uses correct URL', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockCreateHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await createHousehold(mockHouseholdCreationPayloadUK);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${TEST_COUNTRIES.UK}/household`,
        expect.any(Object)
      );
    });

    test('given server error then throws generic error message', async () => {
      // Given
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(createHousehold(mockHouseholdCreationPayload)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_HOUSEHOLD_FAILED
      );
    });

    test('given network failure then propagates network error', async () => {
      // Given
      (global.fetch as any).mockRejectedValue(mockFetchError);

      // When/Then
      await expect(createHousehold(mockHouseholdCreationPayload)).rejects.toThrow(ERROR_MESSAGES.FAILED_TO_FETCH);
    });

    test('given large payload then sends complete JSON body', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockCreateHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await createHousehold(mockLargeHouseholdPayload);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(mockLargeHouseholdPayload),
        })
      );
    });
  });
});