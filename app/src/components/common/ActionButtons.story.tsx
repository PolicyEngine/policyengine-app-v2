import type { Meta, StoryObj } from '@storybook/react';
import { Group } from '@/components/ui';
import {
  EditAndSaveNewButton,
  EditAndUpdateButton,
  EditDefaultButton,
  ShareButton,
  SwapButton,
  ViewButton,
} from './ActionButtons';

const meta: Meta = {
  title: 'Building blocks/ActionButtons',
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const IconOnly: Story = {
  render: () => (
    <Group gap="sm">
      <ViewButton onClick={() => {}} />
      <EditDefaultButton onClick={() => {}} />
      <ShareButton onClick={() => {}} />
      <SwapButton onClick={() => {}} />
    </Group>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <Group gap="sm">
      <EditAndUpdateButton label="Update existing policy" onClick={() => {}} />
      <EditAndSaveNewButton label="Save as new policy" onClick={() => {}} />
    </Group>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Group gap="sm">
      <EditDefaultButton label="Edit" disabled onClick={() => {}} />
      <ShareButton disabled onClick={() => {}} />
    </Group>
  ),
};
