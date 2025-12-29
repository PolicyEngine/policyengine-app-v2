import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  TEST_POLICY_IDS,
  SAMPLE_RESPONSES,
  API_ENDPOINTS,
  mockFetchSuccess,
  mockFetchError,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

import { fetchParameterValues } from '@/api/v2/parameterValues';

describe('parameterValues', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchParameterValues', () => {
    const TEST_PARAMETER_ID = 'param-1';

    it('given parameter and policy IDs then fetches with correct query params', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.PARAMETER_VALUES)
      );

      // When
      const result = await fetchParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE);

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.PARAMETER_VALUES);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.PARAMETER_VALUES(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE)
      );
    });

    it('given different policy ID then fetches with that policy', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.PARAMETER_VALUES)
      );

      // When
      await fetchParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.REFORM);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.PARAMETER_VALUES(TEST_PARAMETER_ID, TEST_POLICY_IDS.REFORM)
      );
    });

    it('given failed response then throws error with parameter and policy IDs', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(
        fetchParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE)
      ).rejects.toThrow(
        `Failed to fetch parameter values for parameter ${TEST_PARAMETER_ID} with policy ${TEST_POLICY_IDS.BASELINE}`
      );
    });

    it('given empty response then returns empty array', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess([]));

      // When
      const result = await fetchParameterValues(TEST_PARAMETER_ID, TEST_POLICY_IDS.BASELINE);

      // Then
      expect(result).toEqual([]);
    });
  });
});
