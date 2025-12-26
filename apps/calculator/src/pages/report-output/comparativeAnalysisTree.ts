export interface TreeNode {
  name: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

/**
 * Get the tree structure for Comparative Analysis submenu
 * Based on V1 tree structure but adapted for V2
 */
export function getComparativeAnalysisTree(countryId: string): TreeNode[] {
  return [
    {
      name: 'budgetaryImpact',
      label: 'Budgetary Impact',
      children: [
        {
          name: 'budgetary-impact-overall',
          label: 'Overall',
        },
        ...(countryId === 'uk'
          ? [
              {
                name: 'budgetary-impact-by-program',
                label: 'By program',
              },
            ]
          : []),
      ],
    },
    {
      name: 'distributionalImpact',
      label: 'Distributional Impact',
      children: [
        {
          name: 'distributionalImpact.incomeDecile',
          label: 'By income decile',
          children: [
            {
              name: 'distributional-impact-income-relative',
              label: 'Relative',
            },
            {
              name: 'distributional-impact-income-average',
              label: 'Absolute',
            },
          ],
        },
        ...(countryId === 'uk'
          ? [
              {
                name: 'distributionalImpact.wealthDecile',
                label: 'By wealth decile',
                children: [
                  {
                    name: 'distributional-impact-wealth-relative',
                    label: 'Relative',
                  },
                  {
                    name: 'distributional-impact-wealth-average',
                    label: 'Absolute',
                  },
                ],
              },
            ]
          : []),
      ],
    },
    {
      name: 'winnersAndLosers',
      label: 'Winners and Losers',
      children: [
        {
          name: 'winners-losers-income-decile',
          label: 'By income decile',
        },
        ...(countryId === 'uk'
          ? [
              {
                name: 'winners-losers-wealth-decile',
                label: 'By wealth decile',
              },
            ]
          : []),
      ],
    },
    {
      name: 'povertyImpact',
      label: 'Poverty Impact',
      children: [
        {
          name: 'povertyImpact.regular',
          label: 'Regular poverty',
          children: [
            {
              name: 'poverty-impact-age',
              label: 'By age',
            },
            {
              name: 'poverty-impact-gender',
              label: 'By gender',
            },
            ...(countryId === 'us'
              ? [
                  {
                    name: 'poverty-impact-race',
                    label: 'By race',
                  },
                ]
              : []),
          ],
        },
        {
          name: 'povertyImpact.deep',
          label: 'Deep poverty',
          children: [
            {
              name: 'deep-poverty-impact-age',
              label: 'By age',
            },
            {
              name: 'deep-poverty-impact-gender',
              label: 'By gender',
            },
          ],
        },
      ],
    },
    {
      name: 'inequality-impact',
      label: 'Inequality Impact',
    },
  ];
}
