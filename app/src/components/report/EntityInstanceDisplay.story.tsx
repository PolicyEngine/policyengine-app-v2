import type { Meta, StoryObj } from '@storybook/react';
import type { GroupEntityInstance } from '@/utils/householdIndividuals';
import EntityInstanceDisplay from './EntityInstanceDisplay';

const meta: Meta<typeof EntityInstanceDisplay> = {
  title: 'Report output/EntityInstanceDisplay',
  component: EntityInstanceDisplay,
};

export default meta;
type Story = StoryObj<typeof EntityInstanceDisplay>;

const instanceWithMembers: GroupEntityInstance = {
  id: 'your-household',
  name: 'Your household',
  members: [
    {
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
      ],
    },
    {
      id: 'your-partner',
      name: 'Your partner',
      variables: [
        {
          paramName: 'employment_income',
          label: 'Employment income',
          value: 45000,
          unit: 'currency-USD',
        },
        { paramName: 'income_tax', label: 'Income tax', value: 5200, unit: 'currency-USD' },
      ],
    },
    {
      id: 'first-dependent',
      name: 'Your first dependent',
      variables: [
        {
          paramName: 'employment_income',
          label: 'Employment income',
          value: 0,
          unit: 'currency-USD',
        },
        { paramName: 'income_tax', label: 'Income tax', value: 0, unit: 'currency-USD' },
      ],
    },
  ],
};

const singleMemberInstance: GroupEntityInstance = {
  id: 'your-household',
  name: 'Your household',
  members: [
    {
      id: 'you',
      name: 'You',
      variables: [
        {
          paramName: 'employment_income',
          label: 'Employment income',
          value: 52000,
          unit: 'currency-USD',
        },
        { paramName: 'income_tax', label: 'Income tax', value: 7400, unit: 'currency-USD' },
        { paramName: 'eitc', label: 'Earned Income Tax Credit', value: 1200, unit: 'currency-USD' },
      ],
    },
  ],
};

export const WithMembers: Story = {
  args: {
    baselineInstance: instanceWithMembers,
    entityType: 'people',
    showInstanceHeader: true,
    baselineLabel: 'Current law',
    reformLabel: '',
    isSameHousehold: false,
  },
};

export const SingleMember: Story = {
  args: {
    baselineInstance: singleMemberInstance,
    entityType: 'people',
    showInstanceHeader: false,
    baselineLabel: 'Current law',
    reformLabel: '',
    isSameHousehold: false,
  },
};
