import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  TEST_COUNTRIES,
  MODEL_IDS,
  SAMPLE_RESPONSES,
  API_ENDPOINTS,
  mockFetchSuccess,
  mockFetchError,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

import { fetchParameters } from '@/api/v2/parameters';

describe('parameters', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchParameters', () => {
    it('given US country then fetches parameters with correct model ID', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.PARAMETERS));

      // When
      const result = await fetchParameters(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.PARAMETERS);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.PARAMETERS(MODEL_IDS.US));
    });

    it('given UK country then fetches parameters with correct model ID', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.PARAMETERS));

      // When
      await fetchParameters(TEST_COUNTRIES.UK);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.PARAMETERS(MODEL_IDS.UK));
    });

    it('given failed response then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchParameters(TEST_COUNTRIES.US)).rejects.toThrow(
        `Failed to fetch parameters for ${TEST_COUNTRIES.US}`
      );
    });

    it('given unknown country then throws error', async () => {
      // When/Then
      await expect(fetchParameters('unknown')).rejects.toThrow('Unknown country: unknown');
    });
  });
});
