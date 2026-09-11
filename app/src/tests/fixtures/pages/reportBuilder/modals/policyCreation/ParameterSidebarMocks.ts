import { ParameterTreeNode } from '@/types/metadata';

export const PARAMETER_TREE_NAMES = {
  FOLDER: 'gov.credits',
  FIRST_CHILD: 'gov.credits.child_tax_credit',
  SECOND_CHILD: 'gov.credits.earned_income_tax_credit',
} as const;

export const PARAMETER_TREE_LABELS = {
  FOLDER: 'Tax credits',
  FIRST_CHILD: 'Child Tax Credit',
  SECOND_CHILD: 'Earned Income Tax Credit',
} as const;

export const PARAMETER_SIDEBAR_TREE: ParameterTreeNode = {
  name: 'gov',
  label: 'Government',
  index: 0,
  children: [
    {
      name: PARAMETER_TREE_NAMES.FOLDER,
      label: PARAMETER_TREE_LABELS.FOLDER,
      index: 0,
      children: [
        {
          name: PARAMETER_TREE_NAMES.FIRST_CHILD,
          label: PARAMETER_TREE_LABELS.FIRST_CHILD,
          index: 0,
          type: 'parameter',
        },
        {
          name: PARAMETER_TREE_NAMES.SECOND_CHILD,
          label: PARAMETER_TREE_LABELS.SECOND_CHILD,
          index: 1,
          type: 'parameter',
        },
      ],
    },
  ],
};
