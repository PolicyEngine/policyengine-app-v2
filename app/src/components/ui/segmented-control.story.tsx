import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from './segmented-control';

const meta: Meta<typeof SegmentedControl> = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

function ControlledSegmented({
  size,
  options,
  defaultValue,
}: {
  size?: 'xs' | 'sm';
  options: { label: string; value: string; disabled?: boolean }[];
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return <SegmentedControl value={value} onValueChange={setValue} options={options} size={size} />;
}

export const Default: Story = {
  render: () => (
    <ControlledSegmented
      options={[
        { label: 'Absolute', value: 'absolute' },
        { label: 'Relative', value: 'relative' },
      ]}
      defaultValue="absolute"
    />
  ),
};

export const ExtraSmall: Story = {
  render: () => (
    <ControlledSegmented
      size="xs"
      options={[
        { label: 'Geographic', value: 'geographic' },
        { label: 'Hex grid', value: 'hex' },
      ]}
      defaultValue="geographic"
    />
  ),
};

export const ThreeOptions: Story = {
  render: () => (
    <ControlledSegmented
      options={[
        { label: 'Income', value: 'income' },
        { label: 'Wealth', value: 'wealth' },
        { label: 'Consumption', value: 'consumption' },
      ]}
      defaultValue="income"
    />
  ),
};
