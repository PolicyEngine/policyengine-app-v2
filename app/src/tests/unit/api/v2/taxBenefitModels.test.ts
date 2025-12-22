import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  TEST_COUNTRIES,
  MODEL_IDS,
  SAMPLE_RESPONSES,
  API_ENDPOINTS,
  mockFetchSuccess,
  mockFetchError,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

// Import the module
import {
  fetchTaxBenefitModels,
  fetchModelVersion,
  fetchModelVersionId,
  getModelId,
  COUNTRY_TO_MODEL_ID,
  API_V2_BASE_URL,
} from '@/api/v2/taxBenefitModels';

describe('taxBenefitModels', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('COUNTRY_TO_MODEL_ID', () => {
    it('given US country then returns correct model ID', () => {
      // Then
      expect(COUNTRY_TO_MODEL_ID.us).toBe(MODEL_IDS.US);
    });

    it('given UK country then returns correct model ID', () => {
      // Then
      expect(COUNTRY_TO_MODEL_ID.uk).toBe(MODEL_IDS.UK);
    });
  });

  describe('API_V2_BASE_URL', () => {
    it('given API URL then matches expected value', () => {
      // Then
      expect(API_V2_BASE_URL).toBe('https://v2.api.policyengine.org');
    });
  });

  describe('getModelId', () => {
    it('given US country then returns US model ID', () => {
      // When
      const result = getModelId(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(MODEL_IDS.US);
    });

    it('given UK country then returns UK model ID', () => {
      // When
      const result = getModelId(TEST_COUNTRIES.UK);

      // Then
      expect(result).toBe(MODEL_IDS.UK);
    });

    it('given unknown country then throws error', () => {
      // When/Then
      expect(() => getModelId('unknown')).toThrow('Unknown country: unknown');
    });
  });

  describe('fetchTaxBenefitModels', () => {
    it('given successful response then returns array of models', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.TAX_BENEFIT_MODELS)
      );

      // When
      const result = await fetchTaxBenefitModels();

      // Then
      expect(result).toEqual(SAMPLE_RESPONSES.TAX_BENEFIT_MODELS);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.TAX_BENEFIT_MODELS);
    });

    it('given failed response then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchTaxBenefitModels()).rejects.toThrow('Failed to fetch tax benefit models');
    });
  });

  describe('fetchModelVersion', () => {
    it('given US country with versions then returns first version string', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.MODEL_VERSIONS)
      );

      // When
      const result = await fetchModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(SAMPLE_RESPONSES.MODEL_VERSIONS[0].version);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.MODEL_VERSIONS(MODEL_IDS.US));
    });

    it('given failed response then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchModelVersion(TEST_COUNTRIES.US)).rejects.toThrow(
        `Failed to fetch model version for ${TEST_COUNTRIES.US}`
      );
    });

    it('given empty versions array then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.EMPTY_VERSIONS)
      );

      // When/Then
      await expect(fetchModelVersion(TEST_COUNTRIES.US)).rejects.toThrow(
        `No versions found for ${TEST_COUNTRIES.US}`
      );
    });
  });

  describe('fetchModelVersionId', () => {
    it('given US country with versions then returns first version ID', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.MODEL_VERSIONS)
      );

      // When
      const result = await fetchModelVersionId(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(SAMPLE_RESPONSES.MODEL_VERSIONS[0].id);
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.MODEL_VERSIONS(MODEL_IDS.US));
    });

    it('given failed response then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchModelVersionId(TEST_COUNTRIES.US)).rejects.toThrow(
        `Failed to fetch model version for ${TEST_COUNTRIES.US}`
      );
    });

    it('given empty versions array then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(
        mockFetchSuccess(SAMPLE_RESPONSES.EMPTY_VERSIONS)
      );

      // When/Then
      await expect(fetchModelVersionId(TEST_COUNTRIES.US)).rejects.toThrow(
        `No versions found for ${TEST_COUNTRIES.US}`
      );
    });
  });
});
