import type { Meta, StoryObj } from '@storybook/react';
import type { TreeNode } from './comparativeAnalysisTree';
import { ReportSidebar } from './ReportSidebar';

const meta: Meta<typeof ReportSidebar> = {
  title: 'Report output/ReportSidebar',
  component: ReportSidebar,
  args: {
    onNavigate: () => {},
    hideOnMobile: false,
  },
};

export default meta;
type Story = StoryObj<typeof ReportSidebar>;

const societyWideTree: TreeNode[] = [
  {
    name: 'budgetaryImpact',
    label: 'Budgetary impact',
    children: [{ name: 'budgetary-impact-overall', label: 'Overall' }],
  },
  {
    name: 'distributionalImpact',
    label: 'Distributional impact',
    children: [
      {
        name: 'distributionalImpact.incomeDecile',
        label: 'By income decile',
        children: [
          { name: 'distributional-impact-income-relative', label: 'Relative' },
          { name: 'distributional-impact-income-average', label: 'Absolute' },
        ],
      },
    ],
  },
  {
    name: 'winnersAndLosers',
    label: 'Winners and losers',
    children: [{ name: 'winners-losers-income-decile', label: 'By income decile' }],
  },
  {
    name: 'povertyImpact',
    label: 'Poverty impact',
    children: [
      {
        name: 'povertyImpact.regular',
        label: 'Regular poverty',
        children: [
          { name: 'poverty-impact-age', label: 'By age' },
          { name: 'poverty-impact-gender', label: 'By gender' },
        ],
      },
      {
        name: 'povertyImpact.deep',
        label: 'Deep poverty',
        children: [
          { name: 'deep-poverty-impact-age', label: 'By age' },
          { name: 'deep-poverty-impact-gender', label: 'By gender' },
        ],
      },
    ],
  },
  { name: 'inequality-impact', label: 'Inequality impact' },
];

const householdTree: TreeNode[] = [
  { name: 'net-income', label: 'Net income' },
  { name: 'earnings-variation', label: 'Varying your earnings' },
  { name: 'marginal-tax-rates', label: 'Marginal tax rates' },
];

export const SocietyWideTree: Story = {
  args: {
    tree: societyWideTree,
    activeView: 'budgetary-impact-overall',
  },
};

export const HouseholdTree: Story = {
  args: {
    tree: householdTree,
    activeView: 'net-income',
  },
};

export const ExpandedNode: Story = {
  args: {
    tree: societyWideTree,
    activeView: 'distributional-impact-income-relative',
  },
};
