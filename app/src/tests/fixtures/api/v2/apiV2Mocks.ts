/**
 * Fixtures for API v2 module tests
 */
import type { TaxBenefitModel, TaxBenefitModelVersion } from '@/api/v2/taxBenefitModels';
import {
  createMockVariables,
  createMockParameters,
  createMockDatasets,
  TEST_COUNTRIES,
} from '@/tests/fixtures/storage/storageMocks';

// Re-export shared constants
export { TEST_COUNTRIES };

// Model IDs
export const MODEL_IDS = {
  US: '8ac12923-1282-420e-a440-0fa60d43950a',
  UK: '00652f95-f350-4932-b65d-9f9f03b4b8eb',
} as const;

// API Base URL
export const API_V2_BASE_URL = 'https://v2.api.policyengine.org';

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Tax benefit model factory
export function createMockTaxBenefitModel(
  overrides: Partial<TaxBenefitModel> = {}
): TaxBenefitModel {
  return {
    id: MODEL_IDS.US,
    name: 'US Model',
    description: 'US Tax-Benefit Model',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Tax benefit model version factory
export function createMockModelVersion(
  overrides: Partial<TaxBenefitModelVersion> = {}
): TaxBenefitModelVersion {
  return {
    id: 'version-id-123',
    model_id: MODEL_IDS.US,
    version: '1.0.0',
    ...overrides,
  };
}

// Mock fetch success response
export function mockFetchSuccess<T>(data: T): Response {
  return {
    ok: true,
    status: HTTP_STATUS.OK,
    json: () => Promise.resolve(data),
  } as Response;
}

// Mock fetch error response
export function mockFetchError(status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): Response {
  return {
    ok: false,
    status,
    statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Internal Server Error',
  } as Response;
}

// Sample API responses
export const SAMPLE_RESPONSES = {
  TAX_BENEFIT_MODELS: [
    createMockTaxBenefitModel({ id: MODEL_IDS.US, name: 'US Model' }),
    createMockTaxBenefitModel({ id: MODEL_IDS.UK, name: 'UK Model' }),
  ],
  MODEL_VERSIONS: [createMockModelVersion()],
  EMPTY_VERSIONS: [] as TaxBenefitModelVersion[],
  VARIABLES: createMockVariables(5),
  PARAMETERS: createMockParameters(5),
  DATASETS: createMockDatasets(3),
} as const;

// Expected API endpoints
export const API_ENDPOINTS = {
  TAX_BENEFIT_MODELS: `${API_V2_BASE_URL}/tax-benefit-models/`,
  MODEL_VERSIONS: (modelId: string) =>
    `${API_V2_BASE_URL}/tax-benefit-model-versions/?model_id=${modelId}`,
  VARIABLES: (modelId: string, limit: number = 10000) =>
    `${API_V2_BASE_URL}/variables/?tax_benefit_model_id=${modelId}&limit=${limit}`,
  PARAMETERS: (modelId: string, limit: number = 10000) =>
    `${API_V2_BASE_URL}/parameters/?tax_benefit_model_id=${modelId}&limit=${limit}`,
  DATASETS: (modelId: string) => `${API_V2_BASE_URL}/datasets/?tax_benefit_model_id=${modelId}`,
} as const;
