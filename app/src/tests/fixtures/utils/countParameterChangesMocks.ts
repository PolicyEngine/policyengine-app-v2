import { PolicyMetadata } from '@/types/metadata/policyMetadata';

export const mockPolicyWithNoJson: PolicyMetadata = {
  id: '1',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {},
  policy_hash: 'abc123',
};

export const mockPolicyWithOneParameterOneRange: PolicyMetadata = {
  id: '1',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {
    'gov.irs.credits.ctc.amount.base': {
      '2024-01-01.2024-12-31': 3000,
    },
  },
  policy_hash: 'abc123',
};

export const mockPolicyWithOneParameterMultipleRanges: PolicyMetadata = {
  id: '1',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {
    'gov.irs.credits.ctc.amount.base': {
      '2024-01-01.2024-12-31': 3000,
      '2025-01-01.2025-12-31': 3500,
      '2026-01-01.2026-12-31': 4000,
    },
  },
  policy_hash: 'abc123',
};

export const mockPolicyWithMultipleParameters: PolicyMetadata = {
  id: '1',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {
    'gov.irs.credits.ctc.amount.base': {
      '2024-01-01.2024-12-31': 3000,
      '2025-01-01.2025-12-31': 3500,
    },
    'gov.irs.credits.eitc.max': {
      '2024-01-01.2024-12-31': 6000,
      '2025-01-01.2025-12-31': 6500,
      '2026-01-01.2026-12-31': 7000,
    },
    'gov.irs.income.standard_deduction': {
      '2024-01-01.2024-12-31': 13850,
    },
  },
  policy_hash: 'abc123',
};

export const mockPolicyWithNullParameter: PolicyMetadata = {
  id: '1',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {
    'gov.irs.credits.ctc.amount.base': null as any,
  },
  policy_hash: 'abc123',
};

export const mockPolicyWithEmptyParameter: PolicyMetadata = {
  id: '1',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {
    'gov.irs.credits.ctc.amount.base': {},
  },
  policy_hash: 'abc123',
};
