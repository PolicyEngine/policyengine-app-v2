import type { Meta, StoryObj } from '@storybook/react';
import { ReportActionButtons } from './ReportActionButtons';

const meta: Meta<typeof ReportActionButtons> = {
  title: 'Report output/ReportActionButtons',
  component: ReportActionButtons,
  args: {
    onSave: () => {},
    onView: () => {},
    onReproduce: () => {},
    shareUrl: 'https://app.policyengine.org/us/report-output/test-report?share=abc123',
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
