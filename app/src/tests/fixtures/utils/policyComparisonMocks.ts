import { Policy } from '@/types/ingredients/Policy';

/**
 * Mock policies for testing policy comparison utilities
 */

export const MOCK_POLICY_A: Policy = {
  id: 'policy-a',
  countryId: 'us',
  apiVersion: '1.0.0',
  label: 'Policy A',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 2000,
        },
      ],
    },
    {
      name: 'gov.irs.deductions.standard.single',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 13850,
        },
      ],
    },
  ],
};

export const MOCK_POLICY_B: Policy = {
  id: 'policy-b',
  countryId: 'us',
  apiVersion: '1.0.0',
  label: 'Policy B',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 3000,
        },
      ],
    },
    {
      name: 'gov.irs.deductions.standard.single',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 13850,
        },
      ],
    },
  ],
};

export const MOCK_POLICY_C: Policy = {
  id: 'policy-c',
  countryId: 'us',
  apiVersion: '1.0.0',
  label: 'Policy C',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 3500,
        },
      ],
    },
    {
      name: 'gov.irs.deductions.standard.single',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 15000,
        },
      ],
    },
  ],
};

// Identical to POLICY_A but different ID
export const MOCK_POLICY_A_CLONE: Policy = {
  id: 'policy-a-clone',
  countryId: 'us',
  apiVersion: '1.0.0',
  label: 'Policy A Clone',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 2000,
        },
      ],
    },
    {
      name: 'gov.irs.deductions.standard.single',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 13850,
        },
      ],
    },
  ],
};

export const MOCK_EMPTY_POLICY: Policy = {
  id: 'empty-policy',
  countryId: 'us',
  apiVersion: '1.0.0',
  label: 'Empty Policy',
  parameters: [],
};
