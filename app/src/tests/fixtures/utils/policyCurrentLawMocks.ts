import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';

export const TEST_PARAMETER_NAMES = {
  changingAmount: 'gov.test.changing_amount',
  zeroAmount: 'gov.test.zero_amount',
  booleanSetting: 'gov.test.boolean_setting',
  structuredValue: 'gov.test.structured_value',
  missingMetadata: 'gov.test.missing_metadata',
} as const;

export const CURRENT_LAW_METADATA: ParameterMetadataCollection = {
  [TEST_PARAMETER_NAMES.changingAmount]: {
    label: 'Changing amount',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.changingAmount,
    unit: 'currency-USD',
    values: {
      '2025-01-01': 100,
      '2026-07-01': 200,
      '2028-01-01': 100,
    },
  },
  [TEST_PARAMETER_NAMES.zeroAmount]: {
    label: 'Zero amount',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.zeroAmount,
    unit: 'currency-USD',
    values: { '2020-01-01': 0 },
  },
  [TEST_PARAMETER_NAMES.booleanSetting]: {
    label: 'Boolean setting',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.booleanSetting,
    unit: 'bool',
    values: { '2020-01-01': false },
  },
  [TEST_PARAMETER_NAMES.structuredValue]: {
    label: 'Structured value',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.structuredValue,
    unit: 'program',
    values: {
      '2020-01-01': {
        programs: ['employment_income', 'self_employment_income'],
        enabled: true,
      },
    },
  },
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
