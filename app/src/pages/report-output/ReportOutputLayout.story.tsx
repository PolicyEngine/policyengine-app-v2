import type { Meta, StoryObj } from '@storybook/react';
import ReportOutputLayout from './ReportOutputLayout';

const meta: Meta<typeof ReportOutputLayout> = {
  title: 'Report output/ReportOutputLayout',
  component: ReportOutputLayout,
  args: {
    onShare: () => {},
    onSave: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReportOutputLayout>;

const PlaceholderContent = ({ text }: { text: string }) => (
  <div
    style={{
      padding: 32,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      textAlign: 'center',
      color: '#868e96',
      minHeight: 200,
    }}
  >
    {text}
  </div>
);

export const SocietyWide: Story = {
  args: {
    reportId: 'rpt-abc123',
    reportLabel: 'Expand Child Tax Credit to $4,000',
    reportYear: '2026',
    modelVersion: '1.0.0',
    dataVersion: '2024.1.0',
    timestamp: 'Ran today at 14:23:41',
    isSharedView: false,
    children: <PlaceholderContent text="Society-wide overview content" />,
  },
};

export const Household: Story = {
  args: {
    reportId: 'rpt-def456',
    reportLabel: 'Household impact analysis',
    reportYear: '2026',
    timestamp: 'Ran yesterday at 09:15:22',
    isSharedView: false,
    children: <PlaceholderContent text="Household overview content" />,
  },
};

export const SharedView: Story = {
  args: {
    reportId: 'rpt-ghi789',
    reportLabel: 'UBI $500/month analysis',
    reportYear: '2026',
    timestamp: 'Shared 2 hours ago',
    isSharedView: true,
    children: <PlaceholderContent text="Shared report content" />,
  },
};
