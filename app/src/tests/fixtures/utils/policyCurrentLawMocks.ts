import type { MetadataState } from '@/types/metadata';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';

export const TEST_PARAMETER_NAMES = {
  amount: 'gov.test.amount',
  zeroAmount: 'gov.test.zero_amount',
  booleanSetting: 'gov.test.boolean_setting',
  structuredSetting: 'gov.test.structured_setting',
  missing: 'gov.test.missing',
} as const;

export const CURRENT_LAW_PARAMETERS: ParameterMetadataCollection = {
  [TEST_PARAMETER_NAMES.amount]: {
    label: 'Amount',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.amount,
    values: {
      '0000-01-01': 100,
      '2027-01-01': 200,
    },
  },
  [TEST_PARAMETER_NAMES.zeroAmount]: {
    label: 'Zero amount',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.zeroAmount,
    values: { '0000-01-01': 0 },
  },
  [TEST_PARAMETER_NAMES.booleanSetting]: {
    label: 'Boolean setting',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.booleanSetting,
    values: { '0000-01-01': false },
  },
  [TEST_PARAMETER_NAMES.structuredSetting]: {
    label: 'Structured setting',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.structuredSetting,
    values: {
      '0000-01-01': {
        enabled: true,
        variables: ['employment_income', 'self_employment_income'],
      },
    },
  },
};

export const READY_POLICY_METADATA: Pick<
  MetadataState,
  'loading' | 'error' | 'currentCountry' | 'currentLawId' | 'version' | 'parameters'
> = {
  loading: false,
  error: null,
  currentCountry: 'us',
  currentLawId: 1,
  version: 'test-version',
  parameters: CURRENT_LAW_PARAMETERS,
};

export function createParameter(
  name: string,
  startDate: string,
  endDate: string,
  value: unknown
): Parameter {
  return {
    name,
    values: [{ startDate, endDate, value }],
  };
}
