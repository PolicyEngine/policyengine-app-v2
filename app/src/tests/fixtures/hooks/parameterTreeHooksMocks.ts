/**
 * Fixtures for parameter tree hooks (useParametersByName, useParameterChildren)
 */
import type { V2ParameterData } from '@/api/v2/parameterTree';
import { TEST_COUNTRIES, TEST_VERSIONS } from '../api/v2/apiV2Mocks';

export { TEST_COUNTRIES, TEST_VERSIONS };

// ---------------------------------------------------------------------------
// V2ParameterData samples (API response shape)
// ---------------------------------------------------------------------------

export const MOCK_V2_PARAM_EITC: V2ParameterData = {
  id: 'param-eitc-max',
  name: 'gov.irs.credits.eitc.max',
  label: 'EITC maximum',
  description: 'Maximum EITC credit amount',
  data_type: 'float',
  unit: 'currency-USD',
  tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_V2_PARAM_CTC: V2ParameterData = {
  id: 'param-ctc-amount',
  name: 'gov.irs.credits.ctc.amount',
  label: 'CTC amount',
  description: 'Child Tax Credit amount',
  data_type: 'float',
  unit: 'currency-USD',
  tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_V2_PARAM_NO_LABEL: V2ParameterData = {
  id: 'param-no-label',
  name: 'gov.irs.rates.base_rate',
  label: null,
  description: null,
  data_type: null,
  unit: null,
  tax_benefit_model_version_id: TEST_VERSIONS.US_VERSION_ID,
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_V2_PARAMS = [MOCK_V2_PARAM_EITC, MOCK_V2_PARAM_CTC];

// ---------------------------------------------------------------------------
// Parameter names for ancestor expansion tests
// ---------------------------------------------------------------------------

export const ANCESTOR_TEST_CASES = {
  SIMPLE: {
    input: ['gov.irs.credits.eitc.max'],
    expected: ['gov.irs', 'gov.irs.credits', 'gov.irs.credits.eitc', 'gov.irs.credits.eitc.max'],
  },
  WITH_INDEX: {
    input: ['gov.irs.credits.eitc.max[0].rate'],
    expected: [
      'gov.irs',
      'gov.irs.credits',
      'gov.irs.credits.eitc',
      'gov.irs.credits.eitc.max[0]',
      'gov.irs.credits.eitc.max[0].rate',
    ],
  },
  MULTIPLE_OVERLAPPING: {
    input: ['gov.irs.credits.eitc.max', 'gov.irs.credits.ctc.amount'],
    expected: [
      'gov.irs',
      'gov.irs.credits',
      'gov.irs.credits.ctc',
      'gov.irs.credits.ctc.amount',
      'gov.irs.credits.eitc',
      'gov.irs.credits.eitc.max',
    ],
  },
  SHORT_PATH: {
    input: ['gov.irs'],
    expected: ['gov.irs'],
  },
  EMPTY: {
    input: [] as string[],
    expected: [] as string[],
  },
} as const;
