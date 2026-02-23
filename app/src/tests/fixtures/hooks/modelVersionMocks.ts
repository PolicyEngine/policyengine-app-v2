/**
 * Fixtures for useModelVersion hook tests
 */
import type { ModelByCountryResponse } from '@/api/v2/taxBenefitModels';
import {
  createMockModelVersion,
  createMockTaxBenefitModel,
  TEST_COUNTRIES,
  TEST_VERSIONS,
} from '../api/v2/apiV2Mocks';

export { TEST_COUNTRIES, TEST_VERSIONS };

// Mock API response
export const MOCK_MODEL_BY_COUNTRY_RESPONSE: ModelByCountryResponse = {
  model: createMockTaxBenefitModel(),
  latest_version: createMockModelVersion(),
};

// Updated version (simulates model version change)
export const UPDATED_VERSION_ID = 'version-id-new-999';

export const MOCK_UPDATED_MODEL_RESPONSE: ModelByCountryResponse = {
  model: createMockTaxBenefitModel(),
  latest_version: createMockModelVersion({ id: UPDATED_VERSION_ID, version: '2.0.0' }),
};

// Cached version that matches the API response
export const MOCK_CACHED_VERSION_MATCHING = {
  versionId: TEST_VERSIONS.US_VERSION_ID,
  version: TEST_VERSIONS.US_VERSION,
  fetchedAt: Date.now(),
};

// Cached version that differs from the API response (stale)
export const MOCK_CACHED_VERSION_STALE = {
  versionId: 'old-version-id',
  version: '0.9.0',
  fetchedAt: Date.now(),
};
