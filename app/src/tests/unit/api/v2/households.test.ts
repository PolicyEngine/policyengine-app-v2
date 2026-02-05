import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createHouseholdV2,
  deleteHouseholdV2,
  fetchHouseholdByIdV2,
  householdToV2Request,
  listHouseholdsV2,
  v2ResponseToHousehold,
} from '@/api/v2/households';
import {
  API_ENDPOINTS,
  API_V2_BASE_URL,
  createMockHousehold,
  createMockHouseholdV2Response,
  HTTP_STATUS,
  mockFetchError,
  mockFetchSuccess,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

describe('v2/households', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('householdToV2Request', () => {
    it('given household then converts to v2 request format', () => {
      // Given
      const household = createMockHousehold();

      // When
      const result = householdToV2Request(household);

      // Then
      expect(result).toEqual({
        tax_benefit_model_name: 'policyengine_us',
        year: 2025,
        label: null,
        people: household.people,
        tax_unit: household.tax_unit,
        family: null,
        spm_unit: null,
        marital_unit: null,
        household: household.household,
        benunit: null,
      });
    });

    it('given household with label then includes label in request', () => {
      // Given
      const household = createMockHousehold({ label: 'Test Household' });

      // When
      const result = householdToV2Request(household);

      // Then
      expect(result.label).toBe('Test Household');
    });

    it('given UK household then includes benunit', () => {
      // Given
      const ukHousehold = createMockHousehold({
        tax_benefit_model_name: 'policyengine_uk',
        benunit: { is_married: true },
        tax_unit: undefined,
      });

      // When
      const result = householdToV2Request(ukHousehold);

      // Then
      expect(result.tax_benefit_model_name).toBe('policyengine_uk');
      expect(result.benunit).toEqual({ is_married: true });
      expect(result.tax_unit).toBeNull();
    });
  });

  describe('v2ResponseToHousehold', () => {
    it('given v2 response then converts to household format', () => {
      // Given
      const response = createMockHouseholdV2Response();

      // When
      const result = v2ResponseToHousehold(response);

      // Then
      expect(result).toEqual({
        id: response.id,
        tax_benefit_model_name: 'policyengine_us',
        year: 2025,
        label: undefined, // null converted to undefined
        people: response.people,
        tax_unit: response.tax_unit,
        family: undefined,
        spm_unit: undefined,
        marital_unit: undefined,
        household: response.household,
        benunit: undefined,
      });
    });

    it('given v2 response with label then includes label', () => {
      // Given
      const response = createMockHouseholdV2Response({ label: 'My Household' });

      // When
      const result = v2ResponseToHousehold(response);

      // Then
      expect(result.label).toBe('My Household');
    });
  });

  describe('createHouseholdV2', () => {
    it('given valid household then creates household via API', async () => {
      // Given
      const household = createMockHousehold();
      const mockResponse = createMockHouseholdV2Response({ id: 'new-household-id' });
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(mockResponse));

      // When
      const result = await createHouseholdV2(household);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.HOUSEHOLDS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: expect.any(String),
      });
      expect(result.id).toBe('new-household-id');
    });

    it('given API error then throws error', async () => {
      // Given
      const household = createMockHousehold();
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: HTTP_STATUS.BAD_REQUEST,
        text: () => Promise.resolve('Invalid data'),
      } as Response);

      // When/Then
      await expect(createHouseholdV2(household)).rejects.toThrow(
        'Failed to create household: 400 Invalid data'
      );
    });
  });

  describe('fetchHouseholdByIdV2', () => {
    it('given valid ID then fetches household', async () => {
      // Given
      const householdId = 'test-household-id';
      const mockResponse = createMockHouseholdV2Response({ id: householdId });
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(mockResponse));

      // When
      const result = await fetchHouseholdByIdV2(householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.HOUSEHOLD_BY_ID(householdId), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      expect(result.id).toBe(householdId);
    });

    it('given 404 response then throws not found error', async () => {
      // Given
      const householdId = 'nonexistent-id';
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError(HTTP_STATUS.NOT_FOUND));

      // When/Then
      await expect(fetchHouseholdByIdV2(householdId)).rejects.toThrow(
        `Household ${householdId} not found`
      );
    });

    it('given server error then throws error with status', async () => {
      // Given
      const householdId = 'test-id';
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        text: () => Promise.resolve('Server error'),
      } as Response);

      // When/Then
      await expect(fetchHouseholdByIdV2(householdId)).rejects.toThrow(
        `Failed to fetch household ${householdId}: 500 Server error`
      );
    });
  });

  describe('listHouseholdsV2', () => {
    it('given no options then lists all households', async () => {
      // Given
      const mockResponses = [createMockHouseholdV2Response()];
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(mockResponses));

      // When
      const result = await listHouseholdsV2();

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.HOUSEHOLDS, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      expect(result).toHaveLength(1);
    });

    it('given model name filter then includes in query params', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess([]));

      // When
      await listHouseholdsV2({ tax_benefit_model_name: 'policyengine_us' });

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/households/?tax_benefit_model_name=policyengine_us`,
        expect.any(Object)
      );
    });

    it('given limit and offset then includes in query params', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess([]));

      // When
      await listHouseholdsV2({ limit: 10, offset: 5 });

      // Then
      const calledUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=5');
    });

    it('given API error then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        text: () => Promise.resolve('Error'),
      } as Response);

      // When/Then
      await expect(listHouseholdsV2()).rejects.toThrow('Failed to list households: 500 Error');
    });
  });

  describe('deleteHouseholdV2', () => {
    it('given valid ID then deletes household', async () => {
      // Given
      const householdId = 'household-to-delete';
      vi.mocked(global.fetch).mockResolvedValue({ ok: true, status: HTTP_STATUS.OK } as Response);

      // When
      await deleteHouseholdV2(householdId);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.HOUSEHOLD_BY_ID(householdId), {
        method: 'DELETE',
      });
    });

    it('given 404 response then throws not found error', async () => {
      // Given
      const householdId = 'nonexistent-id';
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError(HTTP_STATUS.NOT_FOUND));

      // When/Then
      await expect(deleteHouseholdV2(householdId)).rejects.toThrow(
        `Household ${householdId} not found`
      );
    });

    it('given server error then throws error with status', async () => {
      // Given
      const householdId = 'test-id';
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        text: () => Promise.resolve('Deletion failed'),
      } as Response);

      // When/Then
      await expect(deleteHouseholdV2(householdId)).rejects.toThrow(
        `Failed to delete household ${householdId}: 500 Deletion failed`
      );
    });
  });
});
