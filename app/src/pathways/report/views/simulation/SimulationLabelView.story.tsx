import type { Meta, StoryObj } from '@storybook/react';
import SimulationLabelView from './SimulationLabelView';

const meta: Meta<typeof SimulationLabelView> = {
  title: 'Report creation/SimulationLabelView',
  component: SimulationLabelView,
  args: {
    onUpdateLabel: () => {},
    onNext: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SimulationLabelView>;

export const Empty: Story = {
  args: {
    label: null,
    mode: 'standalone',
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Baseline 2026 simulation',
    mode: 'report',
    simulationIndex: 0,
    reportLabel: 'CTC expansion analysis',
  },
};
