export interface TreeNode {
  name: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

/**
 * Get the tree structure for Comparative Analysis submenu
 *
 * All charts have been migrated to the Migration tab:
 * - budgetary-impact-overall, budgetary-impact-by-program
 * - distributional-impact-income-relative, distributional-impact-income-average
 * - distributional-impact-wealth-relative, distributional-impact-wealth-average
 * - winners-losers-income-decile, winners-losers-wealth-decile
 * - poverty-impact-age, poverty-impact-gender, poverty-impact-race
 * - deep-poverty-impact-age, deep-poverty-impact-gender
 * - inequality-impact
 * - congressional-district-absolute, congressional-district-relative
 */
export function getComparativeAnalysisTree(_countryId: string): TreeNode[] {
  return [];
}
