import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchParameterChildren, fetchParametersByName } from '@/api/v2/parameterTree';
import {
  API_ENDPOINTS,
  MOCK_CHILDREN_RESPONSE,
  MOCK_EMPTY_CHILDREN_RESPONSE,
  MOCK_PARAM_NAMES,
  MOCK_PARAMETER_DATA,
  PARENT_PATHS,
  TEST_COUNTRIES,
  mockFetchError,
  mockFetchSuccess,
} from '@/tests/fixtures/api/v2/parameterTreeMocks';

describe('parameterTree API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // fetchParameterChildren
  // -----------------------------------------------------------------------
  describe('fetchParameterChildren', () => {
    it('given valid parent path then fetches children with correct URL', async () => {
      // Given
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockFetchSuccess(MOCK_CHILDREN_RESPONSE));

      // When
      const result = await fetchParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US);

      // Then
      expect(fetchSpy).toHaveBeenCalledWith(
        API_ENDPOINTS.CHILDREN(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
      );
      expect(result).toEqual(MOCK_CHILDREN_RESPONSE);
    });

    it('given empty children then returns empty array', async () => {
      // Given
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockFetchSuccess(MOCK_EMPTY_CHILDREN_RESPONSE),
      );

      // When
      const result = await fetchParameterChildren(PARENT_PATHS.GOV_IRS_CREDITS, TEST_COUNTRIES.US);

      // Then
      expect(result.children).toEqual([]);
    });

    it('given server error then throws with descriptive message', async () => {
      // Given
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockFetchError(500));

      // When / Then
      await expect(
        fetchParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
      ).rejects.toThrow(`Failed to fetch parameter children for path "${PARENT_PATHS.GOV}"`);
    });

    it('given 404 error then throws', async () => {
      // Given
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockFetchError(404));

      // When / Then
      await expect(
        fetchParameterChildren(PARENT_PATHS.GOV_IRS, TEST_COUNTRIES.US),
      ).rejects.toThrow(`Failed to fetch parameter children for path "${PARENT_PATHS.GOV_IRS}"`);
    });

    it('given network failure then propagates error', async () => {
      // Given
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      // When / Then
      await expect(
        fetchParameterChildren(PARENT_PATHS.GOV, TEST_COUNTRIES.US),
      ).rejects.toThrow('Network error');
    });
  });

  // -----------------------------------------------------------------------
  // fetchParametersByName
  // -----------------------------------------------------------------------
  describe('fetchParametersByName', () => {
    it('given parameter names then sends POST request with correct body', async () => {
      // Given
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockFetchSuccess(MOCK_PARAMETER_DATA));

      // When
      const result = await fetchParametersByName([...MOCK_PARAM_NAMES], TEST_COUNTRIES.US);

      // Then
      expect(fetchSpy).toHaveBeenCalledWith(API_ENDPOINTS.BY_NAME, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          names: [...MOCK_PARAM_NAMES],
          country_id: TEST_COUNTRIES.US,
        }),
      });
      expect(result).toEqual(MOCK_PARAMETER_DATA);
    });

    it('given empty names array then returns empty array without fetching', async () => {
      // Given
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // When
      const result = await fetchParametersByName([], TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('given server error then throws', async () => {
      // Given
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockFetchError(500));

      // When / Then
      await expect(
        fetchParametersByName([...MOCK_PARAM_NAMES], TEST_COUNTRIES.US),
      ).rejects.toThrow('Failed to fetch parameters by name');
    });

    it('given network failure then propagates error', async () => {
      // Given
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      // When / Then
      await expect(
        fetchParametersByName([...MOCK_PARAM_NAMES], TEST_COUNTRIES.US),
      ).rejects.toThrow('Network error');
    });
  });
});
