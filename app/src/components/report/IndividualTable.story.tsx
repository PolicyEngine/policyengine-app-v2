import type { Meta, StoryObj } from '@storybook/react';
import type { EntityMember } from '@/utils/householdIndividuals';
import IndividualTable from './IndividualTable';

const meta: Meta<typeof IndividualTable> = {
  title: 'Report output/IndividualTable',
  component: IndividualTable,
};

export default meta;
type Story = StoryObj<typeof IndividualTable>;

const baselineMember: EntityMember = {
  id: 'you',
  name: 'You',
  variables: [
    {
      paramName: 'employment_income',
      label: 'Employment income',
      value: 65000,
      unit: 'currency-USD',
    },
    { paramName: 'income_tax', label: 'Income tax', value: 9800, unit: 'currency-USD' },
    { paramName: 'payroll_tax', label: 'Payroll tax', value: 4972, unit: 'currency-USD' },
    { paramName: 'child_tax_credit', label: 'Child Tax Credit', value: 2000, unit: 'currency-USD' },
    { paramName: 'eitc', label: 'Earned Income Tax Credit', value: 0, unit: 'currency-USD' },
  ],
};

const reformMember: EntityMember = {
  id: 'you',
  name: 'You',
  variables: [
    {
      paramName: 'employment_income',
      label: 'Employment income',
      value: 65000,
      unit: 'currency-USD',
    },
    { paramName: 'income_tax', label: 'Income tax', value: 8200, unit: 'currency-USD' },
    { paramName: 'payroll_tax', label: 'Payroll tax', value: 4972, unit: 'currency-USD' },
    { paramName: 'child_tax_credit', label: 'Child Tax Credit', value: 4000, unit: 'currency-USD' },
    { paramName: 'eitc', label: 'Earned Income Tax Credit', value: 543, unit: 'currency-USD' },
  ],
};

export const BaselineOnly: Story = {
  args: {
    baselineMember,
    baselineLabel: 'Current law',
    reformLabel: '',
    isSameHousehold: false,
  },
};

export const Comparison: Story = {
  args: {
    baselineMember,
    reformMember,
    baselineLabel: 'Current law',
    reformLabel: 'Expand CTC',
    isSameHousehold: false,
  },
};

export const SameHousehold: Story = {
  args: {
    baselineMember,
    reformMember,
    baselineLabel: 'Current law',
    reformLabel: 'Expand CTC',
    isSameHousehold: true,
  },
};
