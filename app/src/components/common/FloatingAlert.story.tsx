import type { Meta, StoryObj } from '@storybook/react';
import { FloatingAlert } from './FloatingAlert';

const meta: Meta<typeof FloatingAlert> = {
  title: 'Building blocks/FloatingAlert',
  component: FloatingAlert,
  args: {
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof FloatingAlert>;

export const Success: Story = {
  args: {
    type: 'success',
    children: 'Report saved successfully',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    children: 'Failed to save report',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'Calculation may take longer than usual',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    children: 'Share link copied to clipboard',
  },
};
