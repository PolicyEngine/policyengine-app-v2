/**
 * Fixtures for storage loaders tests
 */
import type { Metadata, MetadataLoadResult } from '@/storage/loaders/metadataLoader';
import {
  createMockVariables,
  createMockParameters,
  createMockDatasets,
  createMockCacheMetadata,
  TEST_COUNTRIES,
  TEST_VERSIONS,
} from './storageMocks';

// Re-export shared constants
export { TEST_COUNTRIES, TEST_VERSIONS };

// Metadata factory (unified: includes parameters)
export function createMockMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    variables: createMockVariables(5),
    datasets: createMockDatasets(2),
    parameters: createMockParameters(5),
    version: TEST_VERSIONS.US_VERSION,
    versionId: TEST_VERSIONS.US_VERSION_ID,
    ...overrides,
  };
}

// Metadata load result factory
export function createMockMetadataLoadResult(
  overrides: Partial<MetadataLoadResult> = {},
): MetadataLoadResult {
  return {
    data: createMockMetadata(),
    fromCache: false,
    ...overrides,
  };
}

// Valid cache metadata (already loaded)
export function createValidCache() {
  return createMockCacheMetadata({
    loaded: true,
    version: TEST_VERSIONS.US_VERSION,
    versionId: TEST_VERSIONS.US_VERSION_ID,
  });
}

// Stale cache metadata (version mismatch)
export function createStaleCache() {
  return createMockCacheMetadata({
    loaded: true,
    version: 'old-version-0.9.0',
    versionId: 'old-version-id',
  });
}

// API response shapes for mocking
export const API_RESPONSES = {
  MODEL_VERSION: TEST_VERSIONS.US_VERSION,
  MODEL_VERSION_ID: TEST_VERSIONS.US_VERSION_ID,
  STALE_VERSION: 'old-version-0.9.0',
} as const;
