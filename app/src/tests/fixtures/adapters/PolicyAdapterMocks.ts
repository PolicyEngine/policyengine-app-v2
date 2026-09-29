import type { Policy } from '@/types/ingredients/Policy';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { PolicyMetadata, PolicyMetadataParams } from '@/types/metadata/policyMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';

export const TEST_POLICY_IDS = {
  POLICY_1: '1',
  POLICY_2: '2',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_PARAMETER_NAMES = {
  TAX_RATE: 'tax_rate',
  BENEFIT_AMOUNT: 'benefit_amount',
} as const;

export const mockParameterMetadata = (): ParameterMetadataCollection => ({
  tax_rate: {
    label: 'Tax rate',
    type: 'parameter',
    parameter: 'tax_rate',
    unit: '/1',
    values: { '2024-01-01': 0.2 },
  },
  benefit_amount: {
    label: 'Benefit amount',
    type: 'parameter',
    parameter: 'benefit_amount',
    unit: 'currency-USD',
    values: { '2024-01-01': 1000 },
  },
  numeric_parameter: {
    label: 'Numeric parameter',
    type: 'parameter',
    parameter: 'numeric_parameter',
    values: { '2024-01-01': 1 },
  },
  unbounded_numeric_parameter: {
    label: 'Unbounded numeric parameter',
    type: 'parameter',
    parameter: 'unbounded_numeric_parameter',
    unit: 'currency-USD',
    values: {
      '1991-01-01': 'Infinity',
      '2015-01-01': 1_000_000,
      '2026-01-01': '-Infinity',
    },
  },
  boolean_parameter: {
    label: 'Boolean parameter',
    type: 'parameter',
    parameter: 'boolean_parameter',
    unit: 'bool',
    values: { '2024-01-01': true },
  },
  string_parameter: {
    label: 'String parameter',
    type: 'parameter',
    parameter: 'string_parameter',
    values: { '2024-01-01': '00123' },
  },
  structured_parameter: {
    label: 'Structured parameter',
    type: 'parameter',
    parameter: 'structured_parameter',
    values: {
      '2024-01-01': {
        amount: 1,
        enabled: true,
        code: '00123',
        bands: [1, 2],
      },
    },
  },
  string_list_parameter: {
    label: 'String list parameter',
    type: 'parameter',
    parameter: 'string_list_parameter',
    unit: 'list',
    values: {
      '2020-01-01': ['first'],
      '2021-01-01': ['first', 'second', 'third'],
    },
  },
  empty_string_list_parameter: {
    label: 'Empty string list parameter',
    type: 'parameter',
    parameter: 'empty_string_list_parameter',
    unit: 'list',
    values: { '2024-01-01': [] },
  },
});

export const mockPolicyMetadata = (overrides?: Partial<PolicyMetadata>): PolicyMetadata => ({
  id: TEST_POLICY_IDS.POLICY_1,
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_hash: 'hash-123',
  policy_json: {
    tax_rate: {
      '2024-01-01.2024-12-31': 0.25,
      '2025-01-01.2025-12-31': 0.27,
    },
  },
  ...overrides,
});

export const mockPolicyMetadataMultipleParams = (): PolicyMetadata => ({
  id: TEST_POLICY_IDS.POLICY_2,
  country_id: TEST_COUNTRIES.UK,
  api_version: '1.0.0',
  policy_hash: 'hash-456',
  policy_json: {
    tax_rate: {
      '2024-01-01.2024-12-31': 0.2,
    },
    benefit_amount: {
      '2024-01-01.2024-12-31': 1000,
      '2025-01-01.2025-12-31': 1100,
    },
  },
});

export const mockPolicyJson = (): PolicyMetadataParams => ({
  tax_rate: {
    '2024-01-01.2024-12-31': 0.25,
    '2025-01-01.2025-12-31': 0.27,
  },
});

export const mockPolicy = (overrides?: Partial<Policy>): Policy => ({
  id: '1',
  countryId: TEST_COUNTRIES.US,
  apiVersion: '1.0.0',
  parameters: [
    {
      name: TEST_PARAMETER_NAMES.TAX_RATE,
      values: [
        { startDate: '2024-01-01', endDate: '2024-12-31', value: 0.25 },
        { startDate: '2025-01-01', endDate: '2025-12-31', value: 0.27 },
      ],
    },
  ],
  ...overrides,
});

export const mockParameters = (): Parameter[] => [
  {
    name: TEST_PARAMETER_NAMES.TAX_RATE,
    values: [
      { startDate: '2024-01-01', endDate: '2024-12-31', value: 0.25 },
      { startDate: '2025-01-01', endDate: '2025-12-31', value: 0.27 },
    ],
  },
];

export const mockEmptyPolicyJson = (): PolicyMetadataParams => ({});

export const mockEmptyParameters = (): Parameter[] => [];
