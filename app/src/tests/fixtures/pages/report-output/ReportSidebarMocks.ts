/**
 * Mock data and fixtures for ReportSidebar tests
 */
import type { TreeNode } from '@/pages/report-output/comparativeAnalysisTree';

export const TEST_SIDEBAR_TREE: TreeNode[] = [
  {
    name: 'budgetaryImpact',
    label: 'Budgetary impact',
    children: [
      { name: 'budgetaryImpact.overall', label: 'Overall' },
      { name: 'budgetaryImpact.byProgram', label: 'By program' },
    ],
  },
  {
    name: 'distributionalImpact',
    label: 'Distributional impact',
  },
  {
    name: 'disabledSection',
    label: 'Disabled section',
    disabled: true,
  },
];

export const ACTIVE_LEAF_VIEW = 'budgetaryImpact.overall';
export const ACTIVE_PARENT_VIEW = 'budgetaryImpact';
export const INACTIVE_VIEW = 'distributionalImpact';
