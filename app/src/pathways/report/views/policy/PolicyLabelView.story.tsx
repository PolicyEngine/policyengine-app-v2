import type { Meta, StoryObj } from '@storybook/react';
import PolicyLabelView from './PolicyLabelView';

const meta: Meta<typeof PolicyLabelView> = {
  title: 'Report creation/PolicyLabelView',
  component: PolicyLabelView,
  args: {
    onUpdateLabel: () => {},
    onNext: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PolicyLabelView>;

export const Empty: Story = {
  args: {
    label: null,
    mode: 'standalone',
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Expand Child Tax Credit to $4,000',
    mode: 'report',
    simulationIndex: 0,
    reportLabel: 'CTC expansion analysis',
  },
};
