import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  TEST_COUNTRIES,
  MODEL_IDS,
  SAMPLE_RESPONSES,
  API_ENDPOINTS,
  mockFetchSuccess,
  mockFetchError,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

import { fetchVariables } from '@/api/v2/variables';

describe('variables', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchVariables', () => {
    it('given US country then fetches variables with correct URL', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.VARIABLES));

      // When
      const result = await fetchVariables(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.VARIABLES);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.VARIABLES(MODEL_IDS.US));
    });

    it('given UK country then fetches variables with correct model ID', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.VARIABLES));

      // When
      await fetchVariables(TEST_COUNTRIES.UK);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.VARIABLES(MODEL_IDS.UK));
    });

    it('given custom limit then includes limit in URL', async () => {
      // Given
      const customLimit = 500;
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.VARIABLES));

      // When
      await fetchVariables(TEST_COUNTRIES.US, customLimit);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.VARIABLES(MODEL_IDS.US, customLimit));
    });

    it('given failed response then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchVariables(TEST_COUNTRIES.US)).rejects.toThrow(
        `Failed to fetch variables for ${TEST_COUNTRIES.US}`
      );
    });

    it('given unknown country then throws error', async () => {
      // When/Then
      await expect(fetchVariables('unknown')).rejects.toThrow('Unknown country: unknown');
    });
  });
});
