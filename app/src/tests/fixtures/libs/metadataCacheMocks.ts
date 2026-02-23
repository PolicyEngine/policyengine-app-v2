/**
 * Fixtures for metadataCache unit tests
 */
import type { ParameterChildrenResponse } from '@/api/v2';
import type { ParameterMetadata, VariableMetadata } from '@/types/metadata';
import { TEST_COUNTRIES, TEST_VERSIONS } from '../api/v2/apiV2Mocks';

export { TEST_COUNTRIES, TEST_VERSIONS };

// Cache TTL matches the production value (2 weeks)
export const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

// Timestamps for TTL testing
export const TIMESTAMPS = {
  NOW: 1700000000000,
  FRESH: 1700000000000 - 1000, // 1 second ago
  STALE: 1700000000000 - CACHE_TTL_MS - 1000, // just past TTL
  EDGE: 1700000000000 - CACHE_TTL_MS, // exactly at TTL boundary
} as const;

// Storage keys
export const STORAGE_KEYS = {
  MODEL_VERSION: (countryId: string) => `pe_model_version_${countryId}`,
  PARAM_CHILDREN: (countryId: string) => `pe_param_children_${countryId}`,
  PARAMS: (countryId: string) => `pe_params_${countryId}`,
  VARIABLES: (countryId: string) => `pe_variables_${countryId}`,
} as const;

// Mock model version
export const MOCK_MODEL_VERSION = {
  versionId: TEST_VERSIONS.US_VERSION_ID,
  version: TEST_VERSIONS.US_VERSION,
  fetchedAt: TIMESTAMPS.FRESH,
};

export const MOCK_STALE_MODEL_VERSION = {
  ...MOCK_MODEL_VERSION,
  fetchedAt: TIMESTAMPS.STALE,
};

// Mock parameter children
export const MOCK_PARENT_PATH = 'gov.irs';

export const MOCK_CHILDREN_RESPONSE: ParameterChildrenResponse = {
  parent_path: MOCK_PARENT_PATH,
  children: [
    {
      path: 'gov.irs.credits',
      label: 'Credits',
      type: 'node',
      child_count: 5,
      parameter: null,
    },
    {
      path: 'gov.irs.deductions',
      label: 'Deductions',
      type: 'node',
      child_count: 3,
      parameter: null,
    },
  ],
};

// Mock parameter metadata
export const MOCK_PARAMETER_A: ParameterMetadata = {
  id: 'param-a',
  name: 'gov.irs.credits.eitc.max',
  label: 'EITC maximum',
  description: 'Maximum EITC credit',
  parameter: 'gov.irs.credits.eitc.max',
  type: 'parameter',
  values: {},
};

export const MOCK_PARAMETER_B: ParameterMetadata = {
  id: 'param-b',
  name: 'gov.irs.credits.ctc.amount',
  label: 'CTC amount',
  description: 'Child Tax Credit amount',
  parameter: 'gov.irs.credits.ctc.amount',
  type: 'parameter',
  values: {},
};

export const MOCK_PARAMETERS_RECORD: Record<string, ParameterMetadata> = {
  'gov.irs.credits.eitc.max': MOCK_PARAMETER_A,
  'gov.irs.credits.ctc.amount': MOCK_PARAMETER_B,
};

// Mock variable metadata
export const MOCK_VARIABLE: VariableMetadata = {
  name: 'employment_income',
  entity: 'person',
  description: 'Employment income',
  data_type: 'float',
  label: 'Employment income',
};

export const MOCK_VARIABLES_RECORD: Record<string, VariableMetadata> = {
  employment_income: MOCK_VARIABLE,
  age: {
    name: 'age',
    entity: 'person',
    description: 'Age of the person',
    data_type: 'int',
    label: 'Age',
  },
};
