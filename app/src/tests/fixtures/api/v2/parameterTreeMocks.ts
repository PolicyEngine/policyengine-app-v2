/**
 * Fixtures for parameterTree API module tests
 */
import type {
  ParameterChildNode,
  ParameterChildrenResponse,
  V2ParameterData,
} from '@/api/v2/parameterTree';
import { API_V2_BASE_URL, TEST_COUNTRIES, TEST_VERSIONS } from './apiV2Mocks';

export { API_V2_BASE_URL, TEST_COUNTRIES, TEST_VERSIONS };

// ---------------------------------------------------------------------------
// Parameter children
// ---------------------------------------------------------------------------

export const PARENT_PATHS = {
  GOV: 'gov',
  GOV_IRS: 'gov.irs',
  GOV_IRS_CREDITS: 'gov.irs.credits',
} as const;

export const MOCK_CHILD_NODE: ParameterChildNode = {
  path: 'gov.irs.credits',
  label: 'Credits',
  type: 'node',
  child_count: 5,
  parameter: null,
};

export const MOCK_LEAF_NODE: ParameterChildNode = {
  path: 'gov.irs.credits.eitc.max',
  label: 'EITC maximum',
  type: 'parameter',
  child_count: null,
  parameter: {
    id: 'param-eitc-max',
    name: 'gov.irs.credits.eitc.max',
    label: 'EITC maximum',
    description: 'Maximum EITC credit amount',
    data_type: 'float',
    unit: 'currency-USD',
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
  },
};

export const MOCK_CHILDREN_RESPONSE: ParameterChildrenResponse = {
  parent_path: PARENT_PATHS.GOV,
  children: [MOCK_CHILD_NODE, MOCK_LEAF_NODE],
};

export const MOCK_EMPTY_CHILDREN_RESPONSE: ParameterChildrenResponse = {
  parent_path: PARENT_PATHS.GOV_IRS_CREDITS,
  children: [],
};

// ---------------------------------------------------------------------------
// Parameters by name
// ---------------------------------------------------------------------------

export const MOCK_PARAM_NAMES = [
  'gov.irs.credits.eitc.max',
  'gov.irs.credits.ctc.amount',
] as const;

export const MOCK_PARAMETER_DATA: V2ParameterData[] = [
  {
    id: 'param-eitc-max',
    name: 'gov.irs.credits.eitc.max',
    label: 'EITC maximum',
    description: 'Maximum EITC credit amount',
    data_type: 'float',
    unit: 'currency-USD',
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'param-ctc-amount',
    name: 'gov.irs.credits.ctc.amount',
    label: 'CTC amount',
    description: 'Child Tax Credit amount',
    data_type: 'float',
    unit: 'currency-USD',
    tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Expected API endpoints
// ---------------------------------------------------------------------------

export const API_ENDPOINTS = {
  CHILDREN: (parentPath: string, countryId: string) =>
    `${API_V2_BASE_URL}/parameters/children?country_id=${countryId}&parent_path=${parentPath}`,
  BY_NAME: `${API_V2_BASE_URL}/parameters/by-name`,
} as const;

// ---------------------------------------------------------------------------
// Mock fetch helpers
// ---------------------------------------------------------------------------

export function mockFetchSuccess<T>(data: T): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as Response;
}

export function mockFetchError(status: number = 500): Response {
  return {
    ok: false,
    status,
    statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
  } as Response;
}
