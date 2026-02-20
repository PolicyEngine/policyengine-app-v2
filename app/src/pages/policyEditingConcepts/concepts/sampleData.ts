/**
 * Sample data for policy editing concept prototypes.
 * All data is hardcoded — no Redux or API dependencies.
 */

import { INGREDIENT_COLORS } from '@/pages/reportBuilder/constants';

export const POLICY_COLOR = INGREDIENT_COLORS.policy;

export interface DisplayParam {
  paramName: string;
  label: string;
  changes: Array<{ period: string; value: string; rawValue: number | string }>;
  defaultValue: string;
}

export interface SamplePolicy {
  id: string;
  label: string;
  paramCount: number;
}

// The policy being "edited" in each concept
export const SAMPLE_POLICY: SamplePolicy = {
  id: '42',
  label: 'Tax reform package',
  paramCount: 4,
};

// Pre-formatted display params for the grid views
export const SAMPLE_DISPLAY_PARAMS: DisplayParam[] = [
  {
    paramName: 'gov.irs.income.bracket.rates.rate_1',
    label: 'IRS > Income > Bracket rates > Rate 1',
    changes: [{ period: '2025 onward', value: '12%', rawValue: 0.12 }],
    defaultValue: '10%',
  },
  {
    paramName: 'gov.irs.income.bracket.rates.rate_2',
    label: 'IRS > Income > Bracket rates > Rate 2',
    changes: [{ period: '2025 onward', value: '24%', rawValue: 0.24 }],
    defaultValue: '22%',
  },
  {
    paramName: 'gov.irs.credits.eitc.max.amount_1',
    label: 'IRS > Credits > EITC > Max amount (1 child)',
    changes: [{ period: '2025 onward', value: '$4,200', rawValue: 4200 }],
    defaultValue: '$3,995',
  },
  {
    paramName: 'gov.irs.credits.ctc.amount.base',
    label: 'IRS > Credits > CTC > Base amount',
    changes: [
      { period: '2025', value: '$2,500', rawValue: 2500 },
      { period: '2026 onward', value: '$3,000', rawValue: 3000 },
    ],
    defaultValue: '$2,000',
  },
];

// Policies shown in the browse grid
export const SAMPLE_SAVED_POLICIES: SamplePolicy[] = [
  { id: '42', label: 'Tax reform package', paramCount: 4 },
  { id: '55', label: 'EITC expansion', paramCount: 2 },
  { id: '78', label: 'Child benefit increase', paramCount: 1 },
  { id: '91', label: 'Standard deduction boost', paramCount: 3 },
];

// Static parameter tree labels for sidebar mockups
export const SAMPLE_TREE_ITEMS = [
  {
    label: 'IRS',
    children: [
      {
        label: 'Income',
        children: [
          { label: 'Bracket rates', children: [{ label: 'Rate 1' }, { label: 'Rate 2' }] },
        ],
      },
      {
        label: 'Credits',
        children: [
          { label: 'EITC', children: [{ label: 'Max amount (1 child)' }] },
          { label: 'CTC', children: [{ label: 'Base amount' }] },
        ],
      },
    ],
  },
];
