import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EditableLabel } from './EditableLabel';

const meta: Meta<typeof EditableLabel> = {
  title: 'Report builder/EditableLabel',
  component: EditableLabel,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EditableLabel>;

function ControlledLabel({
  initialValue,
  placeholder,
  emptyStateText,
}: {
  initialValue: string;
  placeholder: string;
  emptyStateText?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <EditableLabel
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      emptyStateText={emptyStateText}
    />
  );
}

export const WithValue: Story = {
  render: () => (
    <ControlledLabel
      initialValue="Expand Child Tax Credit to $4,000"
      placeholder="Untitled policy"
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <ControlledLabel
      initialValue=""
      placeholder="Untitled policy"
      emptyStateText="Click to name this policy"
    />
  ),
};

export const LongText: Story = {
  render: () => (
    <ControlledLabel
      initialValue="A very long policy name that should be truncated with an ellipsis when it overflows"
      placeholder="Untitled policy"
    />
  ),
};
