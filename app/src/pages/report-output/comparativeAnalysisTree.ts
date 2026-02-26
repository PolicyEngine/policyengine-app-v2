export interface TreeNode {
  name: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

/**
 * Get the tree structure for Comparative Analysis submenu
 * Based on V1 tree structure but adapted for V2
 *
 * Charts migrated to the Migration tab are excluded:
 * - budgetary-impact-overall
 * - distributional-impact-income-relative
 * - distributional-impact-income-average
 * - winners-losers-income-decile
 * - poverty-impact-age, poverty-impact-gender, poverty-impact-race
 * - deep-poverty-impact-age, deep-poverty-impact-gender
 * - inequality-impact
 */
export function getComparativeAnalysisTree(countryId: string): TreeNode[] {
  return [
    // Budgetary impact: only UK has remaining children (by-program)
    ...(countryId === 'uk'
      ? [
          {
            name: 'budgetaryImpact',
            label: 'Budgetary impact',
            children: [
              {
                name: 'budgetary-impact-by-program',
                label: 'By program',
              },
            ],
          },
        ]
      : []),
    // Distributional impact: only UK has remaining children (wealth-decile)
    ...(countryId === 'uk'
      ? [
          {
            name: 'distributionalImpact',
            label: 'Distributional impact',
            children: [
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
            ],
          },
        ]
      : []),
    // Winners and losers: only UK has remaining children (wealth-decile)
    ...(countryId === 'uk'
      ? [
          {
            name: 'winnersAndLosers',
            label: 'Winners and losers',
            children: [
              {
                name: 'winners-losers-wealth-decile',
                label: 'By wealth decile',
              },
            ],
          },
        ]
      : []),
    // Poverty impact: all charts migrated to Migration tab
    ...(countryId === 'us'
      ? [
          {
            name: 'congressionalDistricts',
            label: 'Congressional districts',
            children: [
              {
                name: 'congressional-district-absolute',
                label: 'Absolute',
              },
              {
                name: 'congressional-district-relative',
                label: 'Relative',
              },
            ],
          },
        ]
      : []),
  ];
}
