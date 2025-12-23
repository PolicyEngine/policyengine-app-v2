import { vi } from 'vitest';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata';
import { PolicyColumn } from '@/utils/policyTableHelpers';

export const MOCK_PARAMETER_METADATA: Record<string, ParameterMetadata> = {
  'gov.irs.credits.ctc.amount': {
    parameter: 'gov.irs.credits.ctc.amount',
    label: 'Child Tax Credit amount',
    unit: 'currency-USD',
    description: 'The amount of the Child Tax Credit',
    type: 'parameter',
  },
  'gov.irs.income_tax.rates.standard[0].rate': {
    parameter: 'gov.irs.income_tax.rates.standard[0].rate',
    label: 'Standard rate',
    unit: '/1',
    description: 'First income tax bracket rate',
    type: 'parameter',
  },
};

export const MOCK_POLICY_BASELINE: Policy = {
  id: 'policy-1',
  countryId: 'us',
  label: 'Current Law',
  apiVersion: '1.0.0',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          value: 2000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      ],
    },
    {
      name: 'gov.irs.income_tax.rates.standard[0].rate',
      values: [
        {
          value: 0.1,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      ],
    },
  ],
};

export const MOCK_POLICY_REFORM: Policy = {
  id: 'policy-2',
  countryId: 'us',
  label: 'Reform Policy',
  apiVersion: '1.0.0',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          value: 3000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      ],
    },
    {
      name: 'gov.irs.income_tax.rates.standard[0].rate',
      values: [
        {
          value: 0.12,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      ],
    },
  ],
};

export const MOCK_POLICY_COLUMNS: PolicyColumn[] = [
  {
    label: 'Baseline',
    policies: [MOCK_POLICY_BASELINE],
    policyLabels: ['Current Law'],
  },
  {
    label: 'Reform',
    policies: [MOCK_POLICY_REFORM],
    policyLabels: ['Reform Policy'],
  },
];

export const MOCK_PARAMETER_NAMES = [
  'gov.irs.credits.ctc.amount',
  'gov.irs.income_tax.rates.standard[0].rate',
];

// Mock render functions
export const createMockRenderFunctions = () => ({
  renderColumnHeader: vi.fn(() => 'BASELINE'),
  renderCurrentLawValue: vi.fn(() => '$2,000'),
  renderColumnValue: vi.fn(() => '$3,000'),
});
