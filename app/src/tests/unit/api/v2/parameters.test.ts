import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchParameters } from '@/api/v2/parameters';
import {
  API_ENDPOINTS,
  mockFetchError,
  mockFetchSuccess,
  MODEL_NAMES,
  SAMPLE_RESPONSES,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

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
    it('given US country then fetches parameters with correct model name', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.PARAMETERS));

      // When
      const result = await fetchParameters(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.PARAMETERS);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.PARAMETERS(MODEL_NAMES.US));
    });

    it('given UK country then fetches parameters with correct model name', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.PARAMETERS));

      // When
      await fetchParameters(TEST_COUNTRIES.UK);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.PARAMETERS(MODEL_NAMES.UK));
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
