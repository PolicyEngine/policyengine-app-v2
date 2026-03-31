import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { V2HouseholdShape } from '@/api/v2/householdCalculation';
import {
  createHouseholdV2,
  deleteHouseholdV2,
  fetchHouseholdByIdV2,
  householdToV2Request,
  listHouseholdsV2,
  v2ResponseToHousehold,
} from '@/api/v2/households';
import {
  createMockHouseholdV2Response,
  createMockV2HouseholdShape,
  mockFetch404,
  mockFetchError,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('households v2 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // householdToV2Request
  // ==========================================================================

  describe('householdToV2Request', () => {
    test('given a V2HouseholdShape then maps all fields to a create request', () => {
      // Given
      const shape: V2HouseholdShape = {
        ...createMockV2HouseholdShape(),
        id: TEST_IDS.HOUSEHOLD_ID,
      };

      // When
      const request = householdToV2Request(shape);

      // Then
      expect(request).toEqual({
        country_id: TEST_COUNTRY_ID,
        year: 2026,
        label: 'Test household',
        people: [{ age: 30, employment_income: 50000 }],
        tax_unit: { members: ['person1'] },
        family: null,
        spm_unit: null,
        marital_unit: null,
        household: null,
        benunit: null,
      });
      // id should not appear in the create request
      expect(request).not.toHaveProperty('id');
    });

    test('given undefined optional fields then null-coalesces them to null', () => {
      // Given
      const shape: V2HouseholdShape = {
        country_id: 'us',
        year: 2026,
        people: [{ age: 25 }],
        // label, tax_unit, family, etc. are all undefined
      };

      // When
      const request = householdToV2Request(shape);

      // Then
      expect(request.label).toBeNull();
      expect(request.tax_unit).toBeNull();
      expect(request.family).toBeNull();
      expect(request.spm_unit).toBeNull();
      expect(request.marital_unit).toBeNull();
      expect(request.household).toBeNull();
      expect(request.benunit).toBeNull();
    });
  });

  // ==========================================================================
  // v2ResponseToHousehold
  // ==========================================================================

  describe('v2ResponseToHousehold', () => {
    test('given an API response then maps id, country_id, and data fields', () => {
      // Given
      const response = createMockHouseholdV2Response();

      // When
      const household = v2ResponseToHousehold(response as any);

      // Then
      expect(household.id).toBe(TEST_IDS.HOUSEHOLD_ID);
      expect(household.country_id).toBe(TEST_COUNTRY_ID);
      expect(household.year).toBe(2026);
      expect(household.label).toBe('Test household');
      expect(household.people).toEqual([{ age: 30, employment_income: 50000 }]);
      expect(household.tax_unit).toEqual({ members: ['person1'] });
    });

    test('given null optional fields in response then converts them to undefined', () => {
      // Given
      const response = createMockHouseholdV2Response();
      // family, spm_unit, marital_unit, household, benunit are null in mock

      // When
      const household = v2ResponseToHousehold(response as any);

      // Then
      expect(household.family).toBeUndefined();
      expect(household.spm_unit).toBeUndefined();
      expect(household.marital_unit).toBeUndefined();
      expect(household.household).toBeUndefined();
      expect(household.benunit).toBeUndefined();
    });

    test('given null label in response then converts it to undefined', () => {
      // Given
      const response = { ...createMockHouseholdV2Response(), label: null };

      // When
      const household = v2ResponseToHousehold(response as any);

      // Then
      expect(household.label).toBeUndefined();
    });
  });

  // ==========================================================================
  // createHouseholdV2
  // ==========================================================================

  describe('createHouseholdV2', () => {
    test('given valid household then POST succeeds with correct URL and body', async () => {
      // Given
      const shape = createMockV2HouseholdShape();
      const apiResponse = createMockHouseholdV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await createHouseholdV2(shape as V2HouseholdShape);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/households/'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
      );
      expect(result.id).toBe(TEST_IDS.HOUSEHOLD_ID);
      expect(result.country_id).toBe(TEST_COUNTRY_ID);
    });

    test('given API returns error then throws with status and message', async () => {
      // Given
      const shape = createMockV2HouseholdShape();
      vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));

      // When / Then
      await expect(createHouseholdV2(shape as V2HouseholdShape)).rejects.toThrow(
        'Failed to create household: 500'
      );
    });
  });

  // ==========================================================================
  // fetchHouseholdByIdV2
  // ==========================================================================

  describe('fetchHouseholdByIdV2', () => {
    test('given valid household ID then GET returns the household', async () => {
      // Given
      const apiResponse = createMockHouseholdV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await fetchHouseholdByIdV2(TEST_IDS.HOUSEHOLD_ID);

      // Then
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/households/${TEST_IDS.HOUSEHOLD_ID}`),
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        })
      );
      expect(result.id).toBe(TEST_IDS.HOUSEHOLD_ID);
    });

    test('given 404 response then throws not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(fetchHouseholdByIdV2(TEST_IDS.HOUSEHOLD_ID)).rejects.toThrow(
        `Household ${TEST_IDS.HOUSEHOLD_ID} not found`
      );
    });

    test('given non-404 error then throws with status and message', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Server Error'));

      // When / Then
      await expect(fetchHouseholdByIdV2(TEST_IDS.HOUSEHOLD_ID)).rejects.toThrow(
        `Failed to fetch household ${TEST_IDS.HOUSEHOLD_ID}: 500`
      );
    });
  });

  // ==========================================================================
  // listHouseholdsV2
  // ==========================================================================

  describe('listHouseholdsV2', () => {
    test('given filters then appends query parameters to URL', async () => {
      // Given
      const apiResponse = [createMockHouseholdV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await listHouseholdsV2({
        country_id: 'us',
        limit: 10,
        offset: 5,
      });

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('country_id=us');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('offset=5');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_IDS.HOUSEHOLD_ID);
    });

    test('given no filters then calls URL without query string', async () => {
      // Given
      const apiResponse = [createMockHouseholdV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await listHouseholdsV2();

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/\/households\/$/);
      expect(calledUrl).not.toContain('?');
      expect(result).toHaveLength(1);
    });
  });

  // ==========================================================================
  // deleteHouseholdV2
  // ==========================================================================

  describe('deleteHouseholdV2', () => {
    test('given existing household then DELETE succeeds with 204', async () => {
      // Given
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 204,
        })
      );

      // When / Then
      await expect(deleteHouseholdV2(TEST_IDS.HOUSEHOLD_ID)).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/households/${TEST_IDS.HOUSEHOLD_ID}`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('given 404 response then throws not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(deleteHouseholdV2(TEST_IDS.HOUSEHOLD_ID)).rejects.toThrow(
        `Household ${TEST_IDS.HOUSEHOLD_ID} not found`
      );
    });
  });
});
