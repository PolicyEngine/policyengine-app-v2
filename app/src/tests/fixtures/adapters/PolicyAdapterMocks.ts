import type { PolicyMetadata, PolicyMetadataParams } from '@/types/metadata/policyMetadata';
import type { Policy } from '@/types/ingredients/Policy';
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
      '2024-01-01.2024-12-31': 0.20,
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
