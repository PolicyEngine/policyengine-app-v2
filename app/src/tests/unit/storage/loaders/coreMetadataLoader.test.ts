import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createMockVariables,
  createMockDatasets,
} from '@/tests/fixtures/storage/storageMocks';
import {
  TEST_COUNTRIES,
  TEST_VERSIONS,
  API_RESPONSES,
  createValidCoreCache,
  createStaleCoreCache,
} from '@/tests/fixtures/storage/loadersMocks';

// Mock the API module
vi.mock('@/api/v2', () => ({
  fetchVariables: vi.fn(),
  fetchDatasets: vi.fn(),
  fetchModelVersion: vi.fn(),
  fetchModelVersionId: vi.fn(),
}));

// Mock the storage module
vi.mock('@/storage', () => ({
  getCacheMetadata: vi.fn(),
  setCacheMetadata: vi.fn(),
  clearAndLoadVariables: vi.fn(),
  clearAndLoadDatasets: vi.fn(),
  getAllVariables: vi.fn(),
  getAllDatasets: vi.fn(),
}));

// Import after mock setup
import {
  fetchVariables,
  fetchDatasets,
  fetchModelVersion,
  fetchModelVersionId,
} from '@/api/v2';
import {
  getCacheMetadata,
  setCacheMetadata,
  clearAndLoadVariables,
  clearAndLoadDatasets,
  getAllVariables,
  getAllDatasets,
} from '@/storage';
import { loadCoreMetadata, isCoreMetadataCached } from '@/storage/loaders/coreMetadataLoader';

describe('coreMetadataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadCoreMetadata', () => {
    it('given valid cache then returns cached data without API fetch', async () => {
      // Given
      const cachedVariables = createMockVariables(5);
      const cachedDatasets = createMockDatasets(2);
      const validCache = createValidCoreCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(validCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(getAllVariables).mockResolvedValue(cachedVariables);
      vi.mocked(getAllDatasets).mockResolvedValue(cachedDatasets);

      // When
      const result = await loadCoreMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(true);
      expect(result.data.variables).toEqual(cachedVariables);
      expect(result.data.datasets).toEqual(cachedDatasets);
      expect(result.data.version).toBe(TEST_VERSIONS.US_VERSION);
      expect(result.data.versionId).toBe(TEST_VERSIONS.US_VERSION_ID);
      expect(fetchVariables).not.toHaveBeenCalled();
      expect(fetchDatasets).not.toHaveBeenCalled();
    });

    it('given stale cache then fetches fresh data from API', async () => {
      // Given
      const freshVariables = createMockVariables(10);
      const freshDatasets = createMockDatasets(3);
      const staleCache = createStaleCoreCache();

      vi.mocked(getCacheMetadata).mockResolvedValue(staleCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);

      // When
      const result = await loadCoreMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(result.data.variables).toEqual(freshVariables);
      expect(result.data.datasets).toEqual(freshDatasets);
      expect(fetchVariables).toHaveBeenCalledWith(TEST_COUNTRIES.US);
      expect(fetchDatasets).toHaveBeenCalledWith(TEST_COUNTRIES.US);
    });

    it('given no cache then fetches fresh data from API', async () => {
      // Given
      const freshVariables = createMockVariables(5);
      const freshDatasets = createMockDatasets(2);

      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);

      // When
      const result = await loadCoreMetadata(TEST_COUNTRIES.US);

      // Then
      expect(result.fromCache).toBe(false);
      expect(result.data.variables).toEqual(freshVariables);
      expect(result.data.datasets).toEqual(freshDatasets);
    });

    it('given fresh data then stores in cache', async () => {
      // Given
      const freshVariables = createMockVariables(5);
      const freshDatasets = createMockDatasets(2);

      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);

      // When
      await loadCoreMetadata(TEST_COUNTRIES.US);

      // Then
      expect(clearAndLoadVariables).toHaveBeenCalledWith(freshVariables);
      expect(clearAndLoadDatasets).toHaveBeenCalledWith(freshDatasets);
      expect(setCacheMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          countryId: TEST_COUNTRIES.US,
          version: API_RESPONSES.MODEL_VERSION,
          versionId: API_RESPONSES.MODEL_VERSION_ID,
          coreLoaded: true,
        })
      );
    });

    it('given existing cache with parameters loaded then preserves parametersLoaded flag', async () => {
      // Given
      const freshVariables = createMockVariables(5);
      const freshDatasets = createMockDatasets(2);
      const cacheWithParams = createValidCoreCache();
      // Make it stale but with parametersLoaded
      cacheWithParams.version = 'old-version';
      cacheWithParams.parametersLoaded = true;

      vi.mocked(getCacheMetadata).mockResolvedValue(cacheWithParams);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);
      vi.mocked(fetchVariables).mockResolvedValue(freshVariables);
      vi.mocked(fetchDatasets).mockResolvedValue(freshDatasets);

      // When
      await loadCoreMetadata(TEST_COUNTRIES.US);

      // Then
      expect(setCacheMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          parametersLoaded: true,
        })
      );
    });
  });

  describe('isCoreMetadataCached', () => {
    it('given valid cache then returns true', async () => {
      // Given
      const validCache = createValidCoreCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(validCache);
      vi.mocked(fetchModelVersion).mockResolvedValue(API_RESPONSES.MODEL_VERSION);
      vi.mocked(fetchModelVersionId).mockResolvedValue(API_RESPONSES.MODEL_VERSION_ID);

      // When
      const result = await isCoreMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(true);
    });

    it('given no cache then returns false', async () => {
      // Given
      vi.mocked(getCacheMetadata).mockResolvedValue(undefined);

      // When
      const result = await isCoreMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });

    it('given cache with coreLoaded false then returns false', async () => {
      // Given
      const incompleteCache = createValidCoreCache();
      incompleteCache.coreLoaded = false;
      vi.mocked(getCacheMetadata).mockResolvedValue(incompleteCache);

      // When
      const result = await isCoreMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });

    it('given stale cache version then returns false', async () => {
      // Given
      const staleCache = createValidCoreCache();
      vi.mocked(getCacheMetadata).mockResolvedValue(staleCache);
      vi.mocked(fetchModelVersion).mockResolvedValue('new-version');
      vi.mocked(fetchModelVersionId).mockResolvedValue('new-version-id');

      // When
      const result = await isCoreMetadataCached(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(false);
    });
  });
});
