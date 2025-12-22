import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createMockParameters,
  createMockParameterValues,
} from '@/tests/fixtures/storage/storageMocks';
import {
  TEST_COUNTRIES,
  TEST_VERSIONS,
  API_RESPONSES,
  createValidCoreCache,
  createValidParametersCache,
} from '@/tests/fixtures/storage/loadersMocks';

// Mock the API module
vi.mock('@/api/v2', () => ({
  fetchParameters: vi.fn(),
  fetchParameterValues: vi.fn(),
  fetchModelVersion: vi.fn(),
}));

// Mock the storage module
vi.mock('@/storage', () => ({
  getCacheMetadata: vi.fn(),
  setCacheMetadata: vi.fn(),
  clearAndLoadParameters: vi.fn(),
  clearAndLoadParameterValues: vi.fn(),
  getAllParameters: vi.fn(),
  getAllParameterValues: vi.fn(),
}));

// Import after mock setup
import { fetchParameters, fetchParameterValues, fetchModelVersion } from '@/api/v2';
import {
  getCacheMetadata,
  setCacheMetadata,
  clearAndLoadParameters,
  clearAndLoadParameterValues,
  getAllParameters,
  getAllParameterValues,
} from '@/storage';
import { loadParameters, isParametersCached } from '@/storage/loaders/parametersLoader';

describe('parametersLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadParameters', () => {
    it('given valid cache with parameters then returns cached data without API fetch', async () => {
      // Given
      const cachedParameters = createMockParameters(10);
      const cachedParameterValues = createMockParameterValues(50);
      const validCache = createValidParametersCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(validCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(getAllParameters).mockResolvedValue(cachedParameters);
      vi.mocked(getAllParameterValues).mockResolvedValue(cachedParameterValues);

      // When
      const result = await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(true);
      expect(result.data.parameters).toEqual(cachedParameters);
      expect(result.data.parameterValues).toEqual(cachedParameterValues);
      expect(fetchParameters).not.toHaveBeenCalled();
      expect(fetchParameterValues).not.toHaveBeenCalled();
    });

    it('given cache without parameters loaded then fetches fresh data', async () => {
      // Given
      const freshParameters = createMockParameters(10);
      const freshParameterValues = createMockParameterValues(50);
      const cacheWithoutParams = createValidCoreCache(); // coreLoaded but not parametersLoaded

      vi.mocked(getCacheMetadata).mockResolvedValue(cacheWithoutParams);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);
      vi.mocked(fetchParameterValues).mockResolvedValue(freshParameterValues);

      // When
      const result = await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(result.data.parameters).toEqual(freshParameters);
      expect(result.data.parameterValues).toEqual(freshParameterValues);
      expect(fetchParameters).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(fetchParameterValues).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given stale version then fetches fresh data', async () => {
      // Given
      const freshParameters = createMockParameters(10);
      const freshParameterValues = createMockParameterValues(50);
      const staleCache = createValidParametersCache();
      staleCache.version = 'old-version';

      vi.mocked(getCacheMetadata).mockResolvedValue(staleCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);
      vi.mocked(fetchParameterValues).mockResolvedValue(freshParameterValues);

      // When
      const result = await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(fetchParameters).toHaveBeenCalled();
      expect(fetchParameterValues).toHaveBeenCalled();
    });

    it('given no cache then fetches fresh data', async () => {
      // Given
      const freshParameters = createMockParameters(10);
      const freshParameterValues = createMockParameterValues(50);

      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);
      vi.mocked(fetchParameterValues).mockResolvedValue(freshParameterValues);

      // When
      const result = await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(result.data.parameters).toEqual(freshParameters);
      expect(result.data.parameterValues).toEqual(freshParameterValues);
    });

    it('given fresh data then stores in cache', async () => {
      // Given
      const freshParameters = createMockParameters(10);
      const freshParameterValues = createMockParameterValues(50);
      const existingCache = createValidCoreCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(existingCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);
      vi.mocked(fetchParameterValues).mockResolvedValue(freshParameterValues);

      // When
      await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(clearAndLoadParameters).toHaveBeenCalledWith(freshParameters);
      expect(clearAndLoadParameterValues).toHaveBeenCalledWith(freshParameterValues);
      expect(setCacheMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          parametersLoaded: true,
        })
      );
    });

    it('given no prior cache then creates new cache metadata', async () => {
      // Given
      const freshParameters = createMockParameters(10);
      const freshParameterValues = createMockParameterValues(50);

      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);
      vi.mocked(fetchParameterValues).mockResolvedValue(freshParameterValues);

      // When
      await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(setCacheMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          countryId: TEST_COUNTRIES.US,
          version: API_RESPONSES.MODEL_VERSION,
          versionId: '',
          coreLoaded: false,
          parametersLoaded: true,
        })
      );
    });

    it('given existing cache then preserves existing fields', async () => {
      // Given
      const freshParameters = createMockParameters(10);
      const freshParameterValues = createMockParameterValues(50);
      const existingCache = createValidCoreCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(existingCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);
      vi.mocked(fetchParameterValues).mockResolvedValue(freshParameterValues);

      // When
      await loadParameters(TEST_COUNTRIES.US);

      // Then
      expect(setCacheMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          countryId: existingCache.countryId,
          version: existingCache.version,
          versionId: existingCache.versionId,
          coreLoaded: existingCache.coreLoaded,
          parametersLoaded: true,
        })
      );
    });
  });

  describe('isParametersCached', () => {
    it('given valid cache with parameters then returns true', async () => {
      // Given
      const validCache = createValidParametersCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(validCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);

      // When
      const result = await isParametersCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(true);
    });

    it('given no cache then returns false', async () => {
      // Given
      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);

      // When
      const result = await isParametersCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });

    it('given cache with parametersLoaded false then returns false', async () => {
      // Given
      const cacheWithoutParams = createValidCoreCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(cacheWithoutParams);

      // When
      const result = await isParametersCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });

    it('given stale version then returns false', async () => {
      // Given
      const staleCache = createValidParametersCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(staleCache);
      vi.mocked(fetchModelVersion).mockResolvedValue('new-version');

      // When
      const result = await isParametersCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });
  });
});
