import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createHousehold,
  createHouseholdFromPayload,
  deleteHousehold,
  fetchHouseholdById,
  fetchHouseholdMetadataById,
  listHouseholds,
} from '@/api/household';
import {
  API_V2_BASE_URL,
  ERROR_MESSAGES,
  EXISTING_HOUSEHOLD_ID,
  HTTP_STATUS,
  mockErrorResponse,
  mockFetchError,
  mockNetworkError,
  mockSuccessResponse,
  mockUSHousehold,
  mockUKHousehold,
  mockV2CreatedHouseholdResponse,
  mockV2HouseholdResponse,
  mockV2HouseholdResponseUK,
  NEW_HOUSEHOLD_ID,
  NON_EXISTENT_HOUSEHOLD_ID,
  TEST_COUNTRIES,
  mockHouseholdCalculatePayload,
} from '@/tests/fixtures/api/householdMocks';

global.fetch = vi.fn();

describe('household API (v2 alpha)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchHouseholdById', () => {
    test('given valid household ID then fetches household from v2 alpha API', async () => {
      // Given
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockSuccessResponse(mockV2HouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchHouseholdById(TEST_COUNTRIES.US, householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${API_V2_BASE_URL}/households/${householdId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      expect(result.id).toBe(EXISTING_HOUSEHOLD_ID);
      expect(result.tax_benefit_model_name).toBe('policyengine_us');
      expect(result.people).toHaveLength(2);
    });

    test('given household not found then throws error with household ID', async () => {
      // Given
      const householdId = NON_EXISTENT_HOUSEHOLD_ID;
      const mockResponse = mockErrorResponse(HTTP_STATUS.NOT_FOUND, 'Not found');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdById(TEST_COUNTRIES.US, householdId)).rejects.toThrow(
        ERROR_MESSAGES.HOUSEHOLD_NOT_FOUND(householdId)
      );
    });

    test('given API returns error then throws error with status', async () => {
      // Given
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Server error');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(fetchHouseholdById(TEST_COUNTRIES.US, householdId)).rejects.toThrow(
        ERROR_MESSAGES.FETCH_HOUSEHOLD_FAILED(householdId)
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      const householdId = EXISTING_HOUSEHOLD_ID;
      (global.fetch as any).mockRejectedValue(mockNetworkError);

      // When/Then
      await expect(fetchHouseholdById(TEST_COUNTRIES.US, householdId)).rejects.toThrow(
        ERROR_MESSAGES.NETWORK_ERROR
      );
    });

    test('given countryId parameter then ignores it (v2 alpha does not use country in URL)', async () => {
      // Given - countryId is provided but should be ignored
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockSuccessResponse(mockV2HouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await fetchHouseholdById(TEST_COUNTRIES.UK, householdId);

      // Then - URL should not contain country
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/households/${householdId}`,
        expect.any(Object)
      );
    });
  });

  describe('fetchHouseholdMetadataById', () => {
    test('given valid household ID then returns household metadata', async () => {
      // Given
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockSuccessResponse(mockV2HouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await fetchHouseholdMetadataById(TEST_COUNTRIES.US, householdId);

      // Then
      expect(result.id).toBe(EXISTING_HOUSEHOLD_ID);
      expect(result.household).toBeDefined();
      expect(result.household.tax_benefit_model_name).toBe('policyengine_us');
    });
  });

  describe('createHousehold', () => {
    test('given valid household data then creates household via v2 alpha API', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockV2CreatedHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await createHousehold(mockUSHousehold);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${API_V2_BASE_URL}/households/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: expect.any(String),
      });
      expect(result).toEqual({ householdId: NEW_HOUSEHOLD_ID });
    });

    test('given household data then sends correct v2 alpha format', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockV2CreatedHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await createHousehold(mockUSHousehold);

      // Then - verify the body format
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.tax_benefit_model_name).toBe('policyengine_us');
      expect(body.year).toBe(mockUSHousehold.year);
      expect(body.people).toEqual(mockUSHousehold.people);
      expect(body.tax_unit).toEqual(mockUSHousehold.tax_unit);
    });

    test('given UK household then creates UK household', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockV2HouseholdResponseUK);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await createHousehold(mockUKHousehold);

      // Then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.tax_benefit_model_name).toBe('policyengine_uk');
      expect(body.benunit).toBeDefined();
      expect(result.householdId).toBe('uk-household-uuid');
    });

    test('given API returns error then throws error with status', async () => {
      // Given
      const mockResponse = mockErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid data');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(createHousehold(mockUSHousehold)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_HOUSEHOLD_FAILED(HTTP_STATUS.BAD_REQUEST, 'Invalid data')
      );
    });

    test('given network failure then propagates error', async () => {
      // Given
      (global.fetch as any).mockRejectedValue(mockFetchError);

      // When/Then
      await expect(createHousehold(mockUSHousehold)).rejects.toThrow(
        ERROR_MESSAGES.FAILED_TO_FETCH
      );
    });
  });

  describe('createHouseholdFromPayload', () => {
    test('given calculation payload then converts to storage format and creates household', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockV2CreatedHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      const payloadWithArrays = {
        ...mockHouseholdCalculatePayload,
        tax_unit: [{ state_code: 'CA' }],
        family: [{}],
      };

      // When
      const result = await createHouseholdFromPayload(payloadWithArrays);

      // Then - verify arrays are converted to single dicts
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.tax_unit).toEqual({ state_code: 'CA' }); // First element extracted
      expect(body.family).toEqual({}); // First element extracted
      expect(result.householdId).toBe(NEW_HOUSEHOLD_ID);
    });

    test('given payload without entity groups then creates household with minimal data', async () => {
      // Given
      const mockResponse = mockSuccessResponse(mockV2CreatedHouseholdResponse);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await createHouseholdFromPayload(mockHouseholdCalculatePayload);

      // Then
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.tax_benefit_model_name).toBe('policyengine_us');
      expect(body.people).toEqual([{ age: 25 }]);
      // v2 API conversion sends null for undefined entity groups
      expect(body.tax_unit).toBeNull();
    });
  });

  describe('listHouseholds', () => {
    test('given no options then lists all households', async () => {
      // Given
      const mockResponse = mockSuccessResponse([mockV2HouseholdResponse]);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await listHouseholds();

      // Then
      expect(global.fetch).toHaveBeenCalledWith(`${API_V2_BASE_URL}/households/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(EXISTING_HOUSEHOLD_ID);
    });

    test('given countryId filter then converts to model name', async () => {
      // Given
      const mockResponse = mockSuccessResponse([mockV2HouseholdResponse]);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await listHouseholds({ countryId: 'us' });

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/households/?tax_benefit_model_name=policyengine_us`,
        expect.any(Object)
      );
    });

    test('given UK countryId then converts to policyengine_uk', async () => {
      // Given
      const mockResponse = mockSuccessResponse([mockV2HouseholdResponseUK]);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await listHouseholds({ countryId: 'uk' });

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/households/?tax_benefit_model_name=policyengine_uk`,
        expect.any(Object)
      );
    });

    test('given limit and offset then includes in query params', async () => {
      // Given
      const mockResponse = mockSuccessResponse([]);
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await listHouseholds({ limit: 10, offset: 20 });

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=20'),
        expect.any(Object)
      );
    });

    test('given API error then throws error', async () => {
      // Given
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Server error');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(listHouseholds()).rejects.toThrow(
        ERROR_MESSAGES.LIST_HOUSEHOLDS_FAILED(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Server error')
      );
    });
  });

  describe('deleteHousehold', () => {
    test('given valid household ID then deletes household', async () => {
      // Given
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = { ok: true, status: HTTP_STATUS.OK };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      await deleteHousehold(householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/households/${householdId}`,
        { method: 'DELETE' }
      );
    });

    test('given household not found then throws error', async () => {
      // Given
      const householdId = NON_EXISTENT_HOUSEHOLD_ID;
      const mockResponse = mockErrorResponse(HTTP_STATUS.NOT_FOUND, 'Not found');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(deleteHousehold(householdId)).rejects.toThrow(
        ERROR_MESSAGES.HOUSEHOLD_NOT_FOUND(householdId)
      );
    });

    test('given API error then throws error with status', async () => {
      // Given
      const householdId = EXISTING_HOUSEHOLD_ID;
      const mockResponse = mockErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Server error');
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(deleteHousehold(householdId)).rejects.toThrow(
        ERROR_MESSAGES.DELETE_HOUSEHOLD_FAILED(
          householdId,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          'Server error'
        )
      );
    });
  });
});
