import type { Meta, StoryObj } from '@storybook/react';
import MetricCard from './MetricCard';

const meta: Meta<typeof MetricCard> = {
  title: 'Building blocks/MetricCard',
  component: MetricCard,
};

export default meta;
type Story = StoryObj<typeof MetricCard>;

export const PositiveTrend: Story = {
  args: {
    label: 'Net income change',
    value: '+$1,200',
    trend: 'positive',
  },
};

export const NegativeTrend: Story = {
  args: {
    label: 'Tax increase',
    value: '+$500',
    trend: 'negative',
  },
};

export const NeutralTrend: Story = {
  args: {
    label: 'No change',
    value: '$0',
    trend: 'neutral',
  },
};

export const Hero: Story = {
  args: {
    label: 'Budgetary impact',
    value: '-$2.1B',
    trend: 'negative',
    hero: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Poverty rate change',
    value: '-0.3pp',
    trend: 'positive',
    description:
      'The reform reduces the supplemental poverty measure by 0.3 percentage points, lifting approximately 950,000 people above the poverty line.',
  },
};

export const InvertedArrow: Story = {
  args: {
    label: 'Poverty rate',
    value: '-1.2%',
    trend: 'negative',
    invertArrow: true,
    description: 'Arrow points up because a poverty decrease is a positive outcome.',
  },
};
