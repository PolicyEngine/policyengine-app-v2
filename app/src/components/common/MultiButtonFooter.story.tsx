import type { Meta, StoryObj } from '@storybook/react';
import MultiButtonFooter from './MultiButtonFooter';

const meta: Meta<typeof MultiButtonFooter> = {
  title: 'Report creation/MultiButtonFooter',
  component: MultiButtonFooter,
};

export default meta;
type Story = StoryObj<typeof MultiButtonFooter>;

export const BackAndNext: Story = {
  args: {
    buttons: [],
    cancelAction: { label: 'Cancel', onClick: () => {} },
    backAction: { label: 'Back', onClick: () => {} },
    primaryAction: { label: 'Next', onClick: () => {} },
  },
};

export const CancelAndSubmit: Story = {
  args: {
    buttons: [],
    cancelAction: { label: 'Cancel', onClick: () => {} },
    primaryAction: { label: 'Create report', onClick: () => {} },
  },
};

export const NextOnly: Story = {
  args: {
    buttons: [],
    primaryAction: { label: 'Initialize report', onClick: () => {} },
  },
};

export const Disabled: Story = {
  args: {
    buttons: [],
    cancelAction: { label: 'Cancel', onClick: () => {} },
    backAction: { label: 'Back', onClick: () => {} },
    primaryAction: {
      label: 'Configure household(s)',
      onClick: () => {},
      isDisabled: true,
    },
  },
};
