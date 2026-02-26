import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Building blocks/EmptyState',
  component: EmptyState,
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Policies: Story = {
  args: {
    ingredient: 'Policy',
  },
};

export const Reports: Story = {
  args: {
    ingredient: 'Report',
  },
};

export const Households: Story = {
  args: {
    ingredient: 'Household',
  },
};
