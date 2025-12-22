/**
 * Fixtures for storage loaders tests
 */
import type { CoreMetadata, CoreMetadataLoadResult } from '@/storage/loaders/coreMetadataLoader';
import type { ParametersData, ParametersLoadResult } from '@/storage/loaders/parametersLoader';
import {
  createMockVariables,
  createMockParameters,
  createMockParameterValues,
  createMockDatasets,
  createMockCacheMetadata,
  TEST_COUNTRIES,
  TEST_VERSIONS,
} from './storageMocks';

// Re-export shared constants
export { TEST_COUNTRIES, TEST_VERSIONS };

// Core metadata factory
export function createMockCoreMetadata(
  overrides: Partial<CoreMetadata> = {}
): CoreMetadata {
  return {
    variables: createMockVariables(5),
    datasets: createMockDatasets(2),
    version: TEST_VERSIONS.US_VERSION,
    versionId: TEST_VERSIONS.US_VERSION_ID,
    ...overrides,
  };
}

// Core metadata load result factory
export function createMockCoreMetadataLoadResult(
  overrides: Partial<CoreMetadataLoadResult> = {}
): CoreMetadataLoadResult {
  return {
    data: createMockCoreMetadata(),
    fromCache: false,
    ...overrides,
  };
}

// Parameters data factory
export function createMockParametersData(
  overrides: Partial<ParametersData> = {}
): ParametersData {
  return {
    parameters: createMockParameters(5),
    parameterValues: createMockParameterValues(10),
    ...overrides,
  };
}

// Parameters load result factory
export function createMockParametersLoadResult(
  overrides: Partial<ParametersLoadResult> = {}
): ParametersLoadResult {
  return {
    data: createMockParametersData(),
    fromCache: false,
    ...overrides,
  };
}

// Valid cache metadata for core (already loaded)
export function createValidCoreCache() {
  return createMockCacheMetadata({
    coreLoaded: true,
    parametersLoaded: false,
    version: TEST_VERSIONS.US_VERSION,
    versionId: TEST_VERSIONS.US_VERSION_ID,
  });
}

// Valid cache metadata for parameters (already loaded)
export function createValidParametersCache() {
  return createMockCacheMetadata({
    coreLoaded: true,
    parametersLoaded: true,
    version: TEST_VERSIONS.US_VERSION,
    versionId: TEST_VERSIONS.US_VERSION_ID,
  });
}

// Stale cache metadata (version mismatch)
export function createStaleCoreCache() {
  return createMockCacheMetadata({
    coreLoaded: true,
    parametersLoaded: false,
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
