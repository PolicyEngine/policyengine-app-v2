import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createHousehold, fetchHouseholdById } from '@/api/household';
import { BASE_URL, CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import {
  ERROR_MESSAGES,
  EXISTING_HOUSEHOLD_ID,
  HTTP_STATUS,
  mockCreateHouseholdResponse,
  mockErrorResponse,
  mockFetchError,
  mockHouseholdCalculatePayload,
  mockHouseholdCalculatePayloadUK,
  mockLargeHouseholdPayload,
  mockNetworkError,
  mockSuccessResponse,
  NON_EXISTENT_HOUSEHOLD_ID,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/householdMocks';

// Mock legacyConversion to isolate API layer from conversion logic
const mockV1ResponseToHousehold = vi.fn();
const mockHouseholdToV1CreationPayload = vi.fn();
vi.mock('@/api/legacyConversion', () => ({
  v1ResponseToHousehold: (...args: any[]) => mockV1ResponseToHousehold(...args),
  householdToV1CreationPayload: (...args: any[]) => mockHouseholdToV1CreationPayload(...args),
  householdToV1Request: vi.fn(),
}));

global.fetch = vi.fn();

// Mock v1 API response format (what the real API returns)
const mockV1ApiResult = {
  id: 12345,
  household_json: { people: { person1: { age: { [CURRENT_YEAR]: 30 } } } },
  label: 'Test Household',
};

// Expected v2 household returned by mocked conversion
const mockConvertedHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [{ person_id: 0, name: 'person1', age: 30 }],
};

// Known v1 creation payload returned by mocked conversion
const mockV1CreationPayload = {
  country_id: 'us',
  data: { people: { person1: { age: { [CURRENT_YEAR]: 25 } } } },
};

describe('household API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockV1ResponseToHousehold.mockReturnValue({ ...mockConvertedHousehold });
    mockHouseholdToV1CreationPayload.mockReturnValue(mockV1CreationPayload);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchHouseholdById', () => {
    test('given valid household ID then fetches household metadata successfully', async () => {
      // Given
      const country = TEST_COUNTRIES.US;
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockSuccessResponse({ result: mockV1ApiResult });
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchHouseholdById(country, householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${country}/household/${householdId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      expect(mockV1ResponseToHousehold).toHaveBeenCalledWith(
        mockV1ApiResult.household_json,
        country
      );
      expect(result.id).toBe(String(mockV1ApiResult.id));
      expect(result.label).toBe(mockV1ApiResult.label);
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
      const mockResponse = mockSuccessResponse({ result: mockV1ApiResult });
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
      await expect(fetchHouseholdById(country, householdId)).rejects.toThrow(
        ERROR_MESSAGES.NETWORK_ERROR
      );
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
      const result = await createHousehold(mockHouseholdCalculatePayload as Household);

      // Then
      expect(mockHouseholdToV1CreationPayload).toHaveBeenCalledWith(mockHouseholdCalculatePayload);
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/us/household`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockV1CreationPayload),
      });
      expect(result).toEqual({
        householdId: String(mockCreateHouseholdResponse.result.household_id),
      });
    });

    test('given API returns error then throws error', async () => {
      // Given
      const mockResponse = mockErrorResponse(HTTP_STATUS.BAD_REQUEST);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(createHousehold(mockHouseholdCalculatePayload as Household)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_HOUSEHOLD_FAILED
      );
    });

    test('given different country in payload then uses correct URL', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockCreateHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);
      mockHouseholdToV1CreationPayload.mockReturnValue({
        country_id: 'uk',
        data: { people: {} },
      });

      // When
      await createHousehold(mockHouseholdCalculatePayloadUK as Household);

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
      await expect(createHousehold(mockHouseholdCalculatePayload as Household)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_HOUSEHOLD_FAILED
      );
    });

    test('given network failure then propagates network error', async () => {
      // Given
      (global.fetch as any).mockRejectedValue(mockFetchError);

      // When/Then
      await expect(createHousehold(mockHouseholdCalculatePayload as Household)).rejects.toThrow(
        ERROR_MESSAGES.FAILED_TO_FETCH
      );
    });

    test('given large payload then sends complete JSON body', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockCreateHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await createHousehold(mockLargeHouseholdPayload as Household);

      // Then
      expect(mockHouseholdToV1CreationPayload).toHaveBeenCalledWith(mockLargeHouseholdPayload);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(mockV1CreationPayload),
        })
      );
    });
  });
});
