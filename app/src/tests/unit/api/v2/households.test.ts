import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createHouseholdV2,
  deleteHouseholdV2,
  fetchHouseholdByIdV2,
  listHouseholdsV2,
} from '@/api/v2/households';
import type { V2CreateHouseholdEnvelope } from '@/models/household/v2Types';
import {
  createMockHouseholdV2Response,
  createMockUkHouseholdV2Response,
  createMockUkV2CreateHouseholdEnvelope,
  createMockV2CreateHouseholdEnvelope,
  mockFetch404,
  mockFetchError,
  mockFetchSuccess,
  TEST_IDS,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('households v2 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // createHouseholdV2
  // ==========================================================================

  describe('createHouseholdV2', () => {
    test('given valid household then POST succeeds with correct URL and body', async () => {
      // Given
      const request: V2CreateHouseholdEnvelope = createMockV2CreateHouseholdEnvelope();
      const apiResponse = createMockHouseholdV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      // When
      const result = await createHouseholdV2(request);

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
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/households/'),
        expect.objectContaining({
          body: JSON.stringify(request),
        })
      );
      expect(result).toEqual(apiResponse);
    });

    test('given API returns error then throws with status and message', async () => {
      // Given
      const request: V2CreateHouseholdEnvelope = createMockV2CreateHouseholdEnvelope();
      vi.stubGlobal('fetch', mockFetchError(500, 'Internal Server Error'));

      // When / Then
      await expect(createHouseholdV2(request)).rejects.toThrow(
        'createHouseholdV2: 500 Internal Server Error'
      );
    });

    test('given valid UK household then POST succeeds with a UK-shaped payload', async () => {
      const request: V2CreateHouseholdEnvelope = createMockUkV2CreateHouseholdEnvelope();
      const apiResponse = createMockUkHouseholdV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      const result = await createHouseholdV2(request);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/households/'),
        expect.objectContaining({
          body: JSON.stringify(request),
        })
      );
      expect(result).toEqual(apiResponse);
      expect(result.country_id).toBe('uk');
      if (result.country_id !== 'uk') {
        throw new Error('Expected UK stored household');
      }
      expect(result.benunit).toEqual([{ benunit_id: 0 }]);
      expect('tax_unit' in result).toBe(false);
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
      expect(result).toEqual(apiResponse);
    });

    test('given 404 response then throws not found error', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(fetchHouseholdByIdV2(TEST_IDS.HOUSEHOLD_ID)).rejects.toThrow(
        `fetchHouseholdByIdV2(${TEST_IDS.HOUSEHOLD_ID}): 404 Not found`
      );
    });

    test('given non-404 error then throws with status and message', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetchError(500, 'Server Error'));

      // When / Then
      await expect(fetchHouseholdByIdV2(TEST_IDS.HOUSEHOLD_ID)).rejects.toThrow(
        `fetchHouseholdByIdV2(${TEST_IDS.HOUSEHOLD_ID}): 500 Server Error`
      );
    });

    test('given a UK household response then GET returns the UK household shape', async () => {
      const apiResponse = createMockUkHouseholdV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      const result = await fetchHouseholdByIdV2(TEST_IDS.HOUSEHOLD_ID);

      expect(result).toEqual(apiResponse);
      expect(result.country_id).toBe('uk');
      if (result.country_id !== 'uk') {
        throw new Error('Expected UK stored household');
      }
      expect(result.benunit).toEqual([{ benunit_id: 0 }]);
      expect('tax_unit' in result).toBe(false);
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
      expect(result[0]).toEqual(apiResponse[0]);
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

    test('given UK filter then returns UK household rows unchanged', async () => {
      const apiResponse = [createMockUkHouseholdV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(apiResponse));

      const result = await listHouseholdsV2({ country_id: 'uk' });

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('country_id=uk');
      expect(result).toEqual(apiResponse);
      expect(result[0].country_id).toBe('uk');
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

    test('given 404 response then resolves without error (already deleted)', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(deleteHouseholdV2(TEST_IDS.HOUSEHOLD_ID)).resolves.toBeUndefined();
    });
  });
});
