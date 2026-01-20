import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDatasets } from '@/api/v2/datasets';
import {
  API_ENDPOINTS,
  mockFetchError,
  mockFetchSuccess,
  MODEL_NAMES,
  SAMPLE_RESPONSES,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

describe('datasets', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchDatasets', () => {
    it('given US country then fetches datasets with correct URL', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.DATASETS));

      // When
      const result = await fetchDatasets(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.DATASETS);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.DATASETS(MODEL_NAMES.US));
    });

    it('given UK country then fetches datasets with correct model name', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(SAMPLE_RESPONSES.DATASETS));

      // When
      await fetchDatasets(TEST_COUNTRIES.UK);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.DATASETS(MODEL_NAMES.UK));
    });

    it('given failed response then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchDatasets(TEST_COUNTRIES.US)).rejects.toThrow(
        `Failed to fetch datasets for ${TEST_COUNTRIES.US}`
      );
    });

    it('given unknown country then throws error', async () => {
      // When/Then
      await expect(fetchDatasets('unknown')).rejects.toThrow('Unknown country: unknown');
    });

    it('given empty datasets response then returns empty array', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess([]));

      // When
      const result = await fetchDatasets(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual([]);
    });
  });
});
