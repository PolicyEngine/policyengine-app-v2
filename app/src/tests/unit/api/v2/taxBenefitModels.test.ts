import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import the module
import {
  API_V2_BASE_URL,
  COUNTRY_TO_MODEL_NAME,
  fetchModelVersion,
  fetchModelVersionId,
  fetchTaxBenefitModels,
  getModelName,
} from '@/api/v2/taxBenefitModels';
import {
  API_ENDPOINTS,
  createMockModelVersion,
  createMockTaxBenefitModel,
  mockFetchError,
  mockFetchSuccess,
  MODEL_NAMES,
  SAMPLE_RESPONSES,
  TEST_COUNTRIES,
} from '@/tests/fixtures/api/v2/apiV2Mocks';

describe('taxBenefitModels', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('COUNTRY_TO_MODEL_NAME', () => {
    it('given US country then returns correct model name', () => {
      // Then
      expect(COUNTRY_TO_MODEL_NAME.us).toBe(MODEL_NAMES.US);
    });

    it('given UK country then returns correct model name', () => {
      // Then
      expect(COUNTRY_TO_MODEL_NAME.uk).toBe(MODEL_NAMES.UK);
    });
  });

  describe('API_V2_BASE_URL', () => {
    it('given API URL then matches expected value', () => {
      // Then
      expect(API_V2_BASE_URL).toBe('https://v2.api.policyengine.org');
    });
  });

  describe('getModelName', () => {
    it('given US country then returns US model name', () => {
      // When
      const result = getModelName(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(MODEL_NAMES.US);
    });

    it('given UK country then returns UK model name', () => {
      // When
      const result = getModelName(TEST_COUNTRIES.UK);

      // Then
      expect(result).toBe(MODEL_NAMES.UK);
    });

    it('given unknown country then throws error', () => {
      // When/Then
      expect(() => getModelName('unknown')).toThrow('Unknown country: unknown');
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
    // Model ID used for filtering versions
    const US_MODEL_ID = 'model-id-us';

    it('given US country with versions then returns first version string', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: US_MODEL_ID, name: MODEL_NAMES.US })];
      const mockVersions = [
        createMockModelVersion({ id: 'v1', model_id: US_MODEL_ID, version: '1.0.0' }),
      ];

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockFetchSuccess(mockModels))
        .mockResolvedValueOnce(mockFetchSuccess(mockVersions));

      // When
      const result = await fetchModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe('1.0.0');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, API_ENDPOINTS.TAX_BENEFIT_MODELS);
      expect(global.fetch).toHaveBeenNthCalledWith(2, API_ENDPOINTS.TAX_BENEFIT_MODEL_VERSIONS);
    });

    it('given failed models fetch then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchModelVersion(TEST_COUNTRIES.US)).rejects.toThrow('Failed to fetch models');
    });

    it('given model not found then throws error', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: 'other-id', name: 'other-model' })];
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(mockModels));

      // When/Then
      await expect(fetchModelVersion(TEST_COUNTRIES.US)).rejects.toThrow(
        `Model not found for ${TEST_COUNTRIES.US}`
      );
    });

    it('given failed versions fetch then throws error', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: US_MODEL_ID, name: MODEL_NAMES.US })];
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockFetchSuccess(mockModels))
        .mockResolvedValueOnce(mockFetchError());

      // When/Then
      await expect(fetchModelVersion(TEST_COUNTRIES.US)).rejects.toThrow(
        'Failed to fetch model versions'
      );
    });

    it('given empty versions array then throws error', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: US_MODEL_ID, name: MODEL_NAMES.US })];
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockFetchSuccess(mockModels))
        .mockResolvedValueOnce(mockFetchSuccess([]));

      // When/Then
      await expect(fetchModelVersion(TEST_COUNTRIES.US)).rejects.toThrow(
        `No versions found for ${TEST_COUNTRIES.US}`
      );
    });
  });

  describe('fetchModelVersionId', () => {
    // Model ID used for filtering versions
    const US_MODEL_ID = 'model-id-us';

    it('given US country with versions then returns first version ID', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: US_MODEL_ID, name: MODEL_NAMES.US })];
      const mockVersions = [
        createMockModelVersion({ id: 'version-id-123', model_id: US_MODEL_ID, version: '1.0.0' }),
      ];

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockFetchSuccess(mockModels))
        .mockResolvedValueOnce(mockFetchSuccess(mockVersions));

      // When
      const result = await fetchModelVersionId(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe('version-id-123');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, API_ENDPOINTS.TAX_BENEFIT_MODELS);
      expect(global.fetch).toHaveBeenNthCalledWith(2, API_ENDPOINTS.TAX_BENEFIT_MODEL_VERSIONS);
    });

    it('given failed models fetch then throws error', async () => {
      // Given
      vi.mocked(global.fetch).mockResolvedValue(mockFetchError());

      // When/Then
      await expect(fetchModelVersionId(TEST_COUNTRIES.US)).rejects.toThrow(
        'Failed to fetch models'
      );
    });

    it('given model not found then throws error', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: 'other-id', name: 'other-model' })];
      vi.mocked(global.fetch).mockResolvedValue(mockFetchSuccess(mockModels));

      // When/Then
      await expect(fetchModelVersionId(TEST_COUNTRIES.US)).rejects.toThrow(
        `Model not found for ${TEST_COUNTRIES.US}`
      );
    });

    it('given empty versions array then throws error', async () => {
      // Given
      const mockModels = [createMockTaxBenefitModel({ id: US_MODEL_ID, name: MODEL_NAMES.US })];
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockFetchSuccess(mockModels))
        .mockResolvedValueOnce(mockFetchSuccess([]));

      // When/Then
      await expect(fetchModelVersionId(TEST_COUNTRIES.US)).rejects.toThrow(
        `No versions found for ${TEST_COUNTRIES.US}`
      );
    });
  });
});
