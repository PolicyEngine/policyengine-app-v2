import type { Meta, StoryObj } from '@storybook/react';
import DataTable from './DataTable';

interface PolicyRow {
  name: string;
  year: string;
  budgetaryImpact: string;
  povertyChange: string;
}

const meta: Meta<typeof DataTable<PolicyRow>> = {
  title: 'Building blocks/DataTable',
  component: DataTable,
};

export default meta;
type Story = StoryObj<typeof DataTable<PolicyRow>>;

const sampleColumns: { key: keyof PolicyRow; header: string }[] = [
  { key: 'name', header: 'Policy name' },
  { key: 'year', header: 'Year' },
  { key: 'budgetaryImpact', header: 'Budgetary impact' },
  { key: 'povertyChange', header: 'Poverty change' },
];

const sampleData: PolicyRow[] = [
  { name: 'Expand CTC to $4,000', year: '2026', budgetaryImpact: '-$120B', povertyChange: '-1.2%' },
  { name: 'Flat tax at 25%', year: '2026', budgetaryImpact: '+$340B', povertyChange: '+0.8%' },
  { name: 'UBI $500/mo', year: '2026', budgetaryImpact: '-$1.8T', povertyChange: '-6.1%' },
  { name: 'Double EITC', year: '2026', budgetaryImpact: '-$67B', povertyChange: '-0.9%' },
  { name: 'Eliminate SALT cap', year: '2026', budgetaryImpact: '-$80B', povertyChange: '+0.1%' },
];

export const Default: Story = {
  args: {
    columns: sampleColumns,
    data: sampleData,
  },
};

export const Empty: Story = {
  args: {
    columns: sampleColumns,
    data: [],
  },
};

interface WideRow {
  state: string;
  population: string;
  medianIncome: string;
  povertyRate: string;
  taxRevenue: string;
  transferSpending: string;
}

const wideColumns: { key: keyof WideRow; header: string }[] = [
  { key: 'state', header: 'State' },
  { key: 'population', header: 'Population' },
  { key: 'medianIncome', header: 'Median income' },
  { key: 'povertyRate', header: 'Poverty rate' },
  { key: 'taxRevenue', header: 'Tax revenue' },
  { key: 'transferSpending', header: 'Transfer spending' },
];

const wideData: WideRow[] = [
  {
    state: 'California',
    population: '39.5M',
    medianIncome: '$91,905',
    povertyRate: '11.0%',
    taxRevenue: '$248B',
    transferSpending: '$183B',
  },
  {
    state: 'Texas',
    population: '30.5M',
    medianIncome: '$73,035',
    povertyRate: '13.4%',
    taxRevenue: '$156B',
    transferSpending: '$121B',
  },
  {
    state: 'New York',
    population: '19.7M',
    medianIncome: '$81,386',
    povertyRate: '12.7%',
    taxRevenue: '$189B',
    transferSpending: '$147B',
  },
];

export const ManyColumns: Story = {
  args: {
    columns: wideColumns as { key: string; header: string }[],
    data: wideData,
  } as any,
};
