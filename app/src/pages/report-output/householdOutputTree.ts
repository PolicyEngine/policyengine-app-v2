import type { TreeNode } from './comparativeAnalysisTree';

/**
 * Get the tree structure for Household Comparative Analysis submenu
 * Based on the household charts migration plan
 */
export function getHouseholdOutputTree(): TreeNode[] {
  return [
    {
      name: 'net-income',
      label: 'Net Income',
    },
    {
      name: 'earnings-variation',
      label: 'Varying Your Earnings',
    },
    {
      name: 'marginal-tax-rates',
      label: 'Marginal Tax Rates',
    },
  ];
}
