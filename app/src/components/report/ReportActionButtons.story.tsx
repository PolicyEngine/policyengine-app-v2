import type { Meta, StoryObj } from '@storybook/react';
import { ReportActionButtons } from './ReportActionButtons';

const meta: Meta<typeof ReportActionButtons> = {
  title: 'Report output/ReportActionButtons',
  component: ReportActionButtons,
  args: {
    shareUrl: 'https://app.policyengine.org/us/report-output/sur-abc123?share=abc',
    onSave: () => {},
    onView: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReportActionButtons>;

export const NormalView: Story = {
  args: {
    isSharedView: false,
  },
};

export const SharedView: Story = {
  args: {
    isSharedView: true,
  },
};
