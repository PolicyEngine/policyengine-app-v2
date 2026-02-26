import type { Meta, StoryObj } from '@storybook/react';
import type { GroupEntity } from '@/utils/householdIndividuals';
import GroupEntityDisplay from './GroupEntityDisplay';

const meta: Meta<typeof GroupEntityDisplay> = {
  title: 'Report output/GroupEntityDisplay',
  component: GroupEntityDisplay,
};

export default meta;
type Story = StoryObj<typeof GroupEntityDisplay>;

const singleInstanceEntity: GroupEntity = {
  entityType: 'people',
  entityTypeName: 'Your household',
  instances: [
    {
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
      ],
    },
  ],
};

const multipleInstancesEntity: GroupEntity = {
  entityType: 'tax_units',
  entityTypeName: 'Your tax units',
  instances: [
    {
      id: 'tax-unit-1',
      name: 'Tax unit 1',
      members: [
        {
          id: 'you',
          name: 'You',
          variables: [
            {
              paramName: 'adjusted_gross_income',
              label: 'Adjusted gross income',
              value: 110000,
              unit: 'currency-USD',
            },
            {
              paramName: 'taxable_income',
              label: 'Taxable income',
              value: 82400,
              unit: 'currency-USD',
            },
          ],
        },
        {
          id: 'your-partner',
          name: 'Your partner',
          variables: [
            {
              paramName: 'adjusted_gross_income',
              label: 'Adjusted gross income',
              value: 45000,
              unit: 'currency-USD',
            },
            {
              paramName: 'taxable_income',
              label: 'Taxable income',
              value: 31200,
              unit: 'currency-USD',
            },
          ],
        },
      ],
    },
    {
      id: 'tax-unit-2',
      name: 'Tax unit 2',
      members: [
        {
          id: 'first-dependent',
          name: 'Your first dependent',
          variables: [
            {
              paramName: 'adjusted_gross_income',
              label: 'Adjusted gross income',
              value: 0,
              unit: 'currency-USD',
            },
            {
              paramName: 'taxable_income',
              label: 'Taxable income',
              value: 0,
              unit: 'currency-USD',
            },
          ],
        },
      ],
    },
  ],
};

export const SingleInstance: Story = {
  args: {
    baselineEntity: singleInstanceEntity,
    baselineLabel: 'Current law',
    reformLabel: '',
    isSameHousehold: false,
  },
};

export const MultipleInstances: Story = {
  args: {
    baselineEntity: multipleInstancesEntity,
    baselineLabel: 'Current law',
    reformLabel: '',
    isSameHousehold: false,
  },
};
