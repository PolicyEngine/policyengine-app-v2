import type { TreeNode } from './comparativeAnalysisTree';

/**
 * Get the tree structure for Household Comparative Analysis submenu
 * Based on the household charts migration plan
 */
export function getHouseholdOutputTree(): TreeNode[] {
  return [
    {
      name: 'net-income',
      label: 'Net income',
    },
    {
      name: 'earnings-variation',
      label: 'Varying your earnings',
    },
    {
      name: 'marginal-tax-rates',
      label: 'Marginal tax rates',
    },
  ];
}
