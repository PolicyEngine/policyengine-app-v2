/**
 * Fixtures for API v2 module tests
 */

// Household factory types
import type { HouseholdV2Response } from '@/api/v2/households';
import type { TaxBenefitModel, TaxBenefitModelVersion } from '@/api/v2/taxBenefitModels';
import type { Household } from '@/types/ingredients/Household';
import type {
  V2DatasetMetadata,
  V2ParameterMetadata,
  V2ParameterValueMetadata,
  V2VariableMetadata,
} from '@/types/metadata';

// Test countries
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// Test versions
export const TEST_VERSIONS = {
  US_VERSION: '1.0.0',
  US_VERSION_ID: 'version-id-123',
  UK_VERSION: '2.0.0',
  UK_VERSION_ID: 'version-id-456',
} as const;

// Variable factory
export function createMockVariable(
  overrides: Partial<V2VariableMetadata> = {}
): V2VariableMetadata {
  return {
    id: 'var-1',
    name: 'test_variable',
    entity: 'person',
    description: 'Test variable description',
    data_type: 'float',
    possible_values: null,
    default_value: 0,
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockVariables(count: number): V2VariableMetadata[] {
  return Array.from({ length: count }, (_, i) =>
    createMockVariable({ id: `var-${i}`, name: `variable_${i}` })
  );
}

// Parameter factory
export function createMockParameter(
  overrides: Partial<V2ParameterMetadata> = {}
): V2ParameterMetadata {
  return {
    id: 'param-1',
    name: 'test.parameter',
    label: 'Test Parameter',
    description: 'Test parameter description',
    data_type: 'float',
    unit: null,
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockParameters(count: number): V2ParameterMetadata[] {
  return Array.from({ length: count }, (_, i) =>
    createMockParameter({ id: `param-${i}`, name: `test.param_${i}`, label: `Param ${i}` })
  );
}

// Dataset factory
export function createMockDataset(overrides: Partial<V2DatasetMetadata> = {}): V2DatasetMetadata {
  return {
    id: 'dataset-1',
    name: 'test_dataset',
    description: 'Test dataset description',
    filepath: '/path/to/dataset',
    year: 2024,
    is_output_dataset: false,
    tax_benefit_model_id: '8ac12923-1282-420e-a440-0fa60d43950a',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockDatasets(count: number): V2DatasetMetadata[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDataset({ id: `dataset-${i}`, name: `dataset_${i}` })
  );
}

// Test policy IDs
export const TEST_POLICY_IDS = {
  BASELINE: 'policy-baseline-123',
  REFORM: 'policy-reform-456',
} as const;

// Parameter value factory
export function createMockParameterValue(
  overrides: Partial<V2ParameterValueMetadata> = {}
): V2ParameterValueMetadata {
  return {
    id: 'pv-1',
    parameter_id: 'param-1',
    policy_id: TEST_POLICY_IDS.BASELINE,
    dynamic_id: null,
    start_date: '2024-01-01T00:00:00',
    end_date: null,
    value_json: 100,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockParameterValues(
  count: number,
  parameterId: string = 'param-1',
  policyId: string | null = TEST_POLICY_IDS.BASELINE
): V2ParameterValueMetadata[] {
  const baseYear = 2020;
  return Array.from({ length: count }, (_, i) =>
    createMockParameterValue({
      id: `pv-${i}`,
      parameter_id: parameterId,
      policy_id: policyId,
      start_date: `${baseYear + i}-01-01T00:00:00`,
      end_date: i > 0 ? `${baseYear + i - 1}-01-01T00:00:00` : null,
      value_json: 100 + i * 10,
    })
  );
}

// Model IDs (UUIDs returned in API responses)
export const MODEL_IDS = {
  US: '8ac12923-1282-420e-a440-0fa60d43950a',
  UK: '00652f95-f350-4932-b65d-9f9f03b4b8eb',
} as const;

// Model names (used for API query parameters)
export const MODEL_NAMES = {
  US: 'policyengine-us',
  UK: 'policyengine-uk',
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
    createMockTaxBenefitModel({ id: MODEL_IDS.US, name: MODEL_NAMES.US }),
    createMockTaxBenefitModel({ id: MODEL_IDS.UK, name: MODEL_NAMES.UK }),
  ],
  MODEL_VERSIONS: [createMockModelVersion()],
  EMPTY_VERSIONS: [] as TaxBenefitModelVersion[],
  VARIABLES: createMockVariables(5),
  PARAMETERS: createMockParameters(5),
  DATASETS: createMockDatasets(3),
  PARAMETER_VALUES: createMockParameterValues(3),
} as const;

// Household factory - v2 API response format
export function createMockHouseholdV2Response(
  overrides: Partial<HouseholdV2Response> = {}
): HouseholdV2Response {
  return {
    id: 'hh-test-uuid-12345',
    tax_benefit_model_name: 'policyengine_us',
    year: 2025,
    label: null,
    people: [{ age: 30, employment_income: 50000 }],
    tax_unit: { state_code: 'CA' },
    family: null,
    spm_unit: null,
    marital_unit: null,
    household: { state_fips: 6 },
    benunit: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    ...overrides,
  };
}

// Household factory - app internal format
export function createMockHousehold(overrides: Partial<Household> = {}): Household {
  return {
    tax_benefit_model_name: 'policyengine_us',
    year: 2025,
    people: [{ age: 30, employment_income: 50000 }],
    tax_unit: { state_code: 'CA' },
    household: { state_fips: 6 },
    ...overrides,
  };
}

// Expected API endpoints
export const API_ENDPOINTS = {
  TAX_BENEFIT_MODELS: `${API_V2_BASE_URL}/tax-benefit-models/`,
  TAX_BENEFIT_MODEL_VERSIONS: `${API_V2_BASE_URL}/tax-benefit-model-versions/`,
  VARIABLES: (modelName: string, limit: number = 10000) =>
    `${API_V2_BASE_URL}/variables/?tax_benefit_model_name=${modelName}&limit=${limit}`,
  PARAMETERS: (modelName: string, limit: number = 10000) =>
    `${API_V2_BASE_URL}/parameters/?tax_benefit_model_name=${modelName}&limit=${limit}`,
  DATASETS: (modelName: string) =>
    `${API_V2_BASE_URL}/datasets/?tax_benefit_model_name=${modelName}`,
  PARAMETER_VALUES: (parameterId: string, policyId: string) =>
    `${API_V2_BASE_URL}/parameter-values/?parameter_id=${parameterId}&policy_id=${policyId}`,
  HOUSEHOLDS: `${API_V2_BASE_URL}/households/`,
  HOUSEHOLD_BY_ID: (id: string) => `${API_V2_BASE_URL}/households/${id}`,
} as const;
