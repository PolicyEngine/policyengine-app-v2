import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchVariables } from '@/api/v2/variables';
import {
  API_ENDPOINTS,
  mockFetchError,
  mockFetchSuccess,
  MODEL_NAMES,
  SAMPLE_RESPONSES,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

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
    it('given US country then fetches variables with correct model name', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.VARIABLES));

      // When
      const result = await fetchVariables(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.VARIABLES);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.VARIABLES(MODEL_NAMES.US));
    });

    it('given UK country then fetches variables with correct model name', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.VARIABLES));

      // When
      await fetchVariables(TEST_COUNTRIES.UK);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.VARIABLES(MODEL_NAMES.UK));
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
