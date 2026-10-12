import { ParameterTreeNode } from '@/types/metadata';

/** A small tree: IRS credits with bracketed EITC, an empty agency, and an undraftable leaf. */
export const POLICY_TREE: ParameterTreeNode = {
  name: 'gov',
  label: 'Gov',
  index: 0,
  children: [
    {
      name: 'gov.irs',
      label: 'Internal Revenue Service (IRS)',
      index: 0,
      children: [
        {
          name: 'gov.irs.credits',
          label: 'Credits',
          index: 0,
          children: [
            {
              name: 'gov.irs.credits.ctc_amount',
              label: 'Child tax credit amount',
              index: 0,
              type: 'parameter',
              description: 'Maximum credit per qualifying child.',
            },
            {
              name: 'gov.irs.credits.eitc.max',
              label: 'EITC maximum',
              index: 0,
              children: [
                {
                  name: 'gov.irs.credits.eitc.max[10]',
                  label: 'Bracket 11',
                  index: 0,
                  children: [
                    {
                      name: 'gov.irs.credits.eitc.max[10].amount',
                      label: 'Amount',
                      index: 0,
                      type: 'parameter',
                    },
                  ],
                },
                {
                  name: 'gov.irs.credits.eitc.max[1]',
                  label: 'Bracket 2',
                  index: 0,
                  children: [
                    {
                      name: 'gov.irs.credits.eitc.max[1].amount',
                      label: 'Amount',
                      index: 0,
                      type: 'parameter',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'gov.irs.internal_switch',
          label: 'Internal switch',
          index: 0,
          type: 'parameter',
        },
      ],
    },
    {
      name: 'gov.bls',
      label: 'Bureau of Labor Statistics (BLS)',
      index: 0,
      children: [{ name: 'gov.bls.cpi', label: 'CPI', index: 0, type: 'parameter' }],
    },
  ],
};

export const DRAFTABLE = new Set([
  'gov.irs.credits.ctc_amount',
  'gov.irs.credits.eitc.max[1].amount',
  'gov.irs.credits.eitc.max[10].amount',
]);
