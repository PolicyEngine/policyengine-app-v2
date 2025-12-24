import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createMockVariables,
  createMockDatasets,
  createMockParameters,
} from '@/tests/fixtures/storage/storageMocks';
import {
  TEST_COUNTRIES,
  TEST_VERSIONS,
  API_RESPONSES,
  createValidCache,
  createStaleCache,
} from '@/tests/fixtures/storage/loadersMocks';

// Mock the API module
vi.mock('@/api/v2', () => ({
  fetchVariables: vi.fn(),
  fetchDatasets: vi.fn(),
  fetchParameters: vi.fn(),
  fetchModelVersion: vi.fn(),
  fetchModelVersionId: vi.fn(),
}));

// Mock the storage module
vi.mock('@/storage', () => ({
  getCacheMetadata: vi.fn(),
  setCacheMetadata: vi.fn(),
  clearAndLoadVariables: vi.fn(),
  clearAndLoadDatasets: vi.fn(),
  clearAndLoadParameters: vi.fn(),
  getAllVariables: vi.fn(),
  getAllDatasets: vi.fn(),
  getAllParameters: vi.fn(),
}));

// Import after mock setup
import {
  fetchVariables,
  fetchDatasets,
  fetchParameters,
  fetchModelVersion,
  fetchModelVersionId,
} from '@/api/v2';
import {
  getCacheMetadata,
  setCacheMetadata,
  clearAndLoadVariables,
  clearAndLoadDatasets,
  clearAndLoadParameters,
  getAllVariables,
  getAllDatasets,
  getAllParameters,
} from '@/storage';
import { loadMetadata, isMetadataCached } from '@/storage/loaders/metadataLoader';

describe('metadataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadMetadata', () => {
    it('given valid cache then returns cached data without API fetch', async () => {
      // Given
      const cachedVariables = createMockVariables(5);
      const cachedDatasets = createMockDatasets(2);
      const cachedParameters = createMockParameters(5);
      const validCache = createValidCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(validCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(getAllVariables).mockResolvedValue(cachedVariables);
      vi.mocked(getAllDatasets).mockResolvedValue(cachedDatasets);
      vi.mocked(getAllParameters).mockResolvedValue(cachedParameters);

      // When
      const result = await loadMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(true);
      expect(result.data.variables).toEqual(cachedVariables);
      expect(result.data.datasets).toEqual(cachedDatasets);
      expect(result.data.parameters).toEqual(cachedParameters);
      expect(result.data.version).toBe(TEST_VERSIONS.US_VERSION);
      expect(result.data.versionId).toBe(TEST_VERSIONS.US_VERSION_ID);
      expect(fetchVariables).not.toHaveBeenCalled();
      expect(fetchDatasets).not.toHaveBeenCalled();
      expect(fetchParameters).not.toHaveBeenCalled();
    });

    it('given stale cache then fetches fresh data from API', async () => {
      // Given
      const freshVariables = createMockVariables(10);
      const freshDatasets = createMockDatasets(3);
      const freshParameters = createMockParameters(5);
      const staleCache = createStaleCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(staleCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);

      // When
      const result = await loadMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(result.data.variables).toEqual(freshVariables);
      expect(result.data.datasets).toEqual(freshDatasets);
      expect(result.data.parameters).toEqual(freshParameters);
      expect(fetchVariables).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(fetchDatasets).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(fetchParameters).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given no cache then fetches fresh data from API', async () => {
      // Given
      const freshVariables = createMockVariables(5);
      const freshDatasets = createMockDatasets(2);
      const freshParameters = createMockParameters(5);

      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);

      // When
      const result = await loadMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(result.data.variables).toEqual(freshVariables);
      expect(result.data.datasets).toEqual(freshDatasets);
      expect(result.data.parameters).toEqual(freshParameters);
    });

    it('given fresh data then stores in cache', async () => {
      // Given
      const freshVariables = createMockVariables(5);
      const freshDatasets = createMockDatasets(2);
      const freshParameters = createMockParameters(5);

      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);
      vi.mocked(fetchParameters).mockResolvedValue(freshParameters);

      // When
      await loadMetadata(TEST_COUNTRIES.US);

      // Then
      expect(clearAndLoadVariables).toHaveBeenCalledWith(freshVariables);
      expect(clearAndLoadDatasets).toHaveBeenCalledWith(freshDatasets);
      expect(clearAndLoadParameters).toHaveBeenCalledWith(freshParameters);
      expect(setCacheMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          countryId: TEST_COUNTRIES.US,
          version: API_RESPONSES.MODEL_VERSION,
          versionId: API_RESPONSES.MODEL_VERSION_ID,
          loaded: true,
        })
      );
    });
  });

  describe('isMetadataCached', () => {
    it('given valid cache then returns true', async () => {
      // Given
      const validCache = createValidCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(validCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);

      // When
      const result = await isMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(true);
    });

    it('given no cache then returns false', async () => {
      // Given
      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);

      // When
      const result = await isMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });

    it('given cache with loaded false then returns false', async () => {
      // Given
      const incompleteCache = createValidCache();
      incompleteCache.loaded = false;
      vi.mocked(getCacheMetadata).mockResolvedValue(incompleteCache);

      // When
      const result = await isMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });

    it('given stale cache version then returns false', async () => {
      // Given
      const staleCache = createValidCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(staleCache);
      vi.mocked(fetchModelVersion).mockResolvedValue('new-version');
      vi.mocked(fetchModelVersionId).mockResolvedValue('new-version-id');

      // When
      const result = await isMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });
  });
});
