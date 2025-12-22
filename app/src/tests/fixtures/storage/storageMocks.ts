/**
 * Fixtures for storage module tests
 */
import type {
  Variable,
  Parameter,
  ParameterValue,
  Dataset,
  CacheMetadata,
} from '@/storage/metadataDb';

// Test country IDs
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// Test version IDs
export const TEST_VERSIONS = {
  US_VERSION: 'us-version-1.0.0',
  US_VERSION_ID: 'us-version-id-123',
  UK_VERSION: 'uk-version-1.0.0',
  UK_VERSION_ID: 'uk-version-id-456',
} as const;

// Mock variable factory
export function createMockVariable(overrides: Partial<Variable> = {}): Variable {
  return {
    id: 'var-1',
    name: 'income_tax',
    entity: 'person',
    description: 'Income tax owed',
    data_type: 'float',
    possible_values: null,
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock parameter factory
export function createMockParameter(overrides: Partial<Parameter> = {}): Parameter {
  return {
    id: 'param-1',
    name: 'basic_rate',
    label: 'Basic Rate',
    description: 'Basic tax rate',
    data_type: 'float',
    unit: 'currency-USD',
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock parameter value factory
export function createMockParameterValue(
  overrides: Partial<ParameterValue> = {}
): ParameterValue {
  return {
    id: 'pv-1',
    parameter_id: 'param-1',
    value_json: 0.2,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    policy_id: null,
    dynamic_id: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock dataset factory
export function createMockDataset(overrides: Partial<Dataset> = {}): Dataset {
  return {
    id: 'dataset-1',
    name: 'cps_2023',
    description: 'Current Population Survey 2023',
    filepath: '/data/cps_2023.h5',
    year: 2023,
    is_output_dataset: false,
    tax_benefit_model_id: 'model-us-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock cache metadata factory
export function createMockCacheMetadata(
  overrides: Partial<CacheMetadata> = {}
): CacheMetadata {
  return {
    countryId: TEST_COUNTRIES.US,
    version: TEST_VERSIONS.US_VERSION,
    versionId: TEST_VERSIONS.US_VERSION_ID,
    coreLoaded: true,
    parametersLoaded: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

// Create multiple mock variables
export function createMockVariables(count: number): Variable[] {
  return Array.from({ length: count }, (_, i) =>
    createMockVariable({
      id: `var-${i + 1}`,
      name: `variable_${i + 1}`,
    })
  );
}

// Create multiple mock parameters
export function createMockParameters(count: number): Parameter[] {
  return Array.from({ length: count }, (_, i) =>
    createMockParameter({
      id: `param-${i + 1}`,
      name: `parameter_${i + 1}`,
    })
  );
}

// Create multiple mock parameter values
export function createMockParameterValues(count: number): ParameterValue[] {
  return Array.from({ length: count }, (_, i) =>
    createMockParameterValue({
      id: `pv-${i + 1}`,
      parameter_id: `param-${(i % 3) + 1}`,
      start_date: `202${i}-01-01`,
      end_date: `202${i}-12-31`,
    })
  );
}

// Create multiple mock datasets
export function createMockDatasets(count: number): Dataset[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDataset({
      id: `dataset-${i + 1}`,
      name: `dataset_${i + 1}`,
      year: 2020 + i,
    })
  );
}
