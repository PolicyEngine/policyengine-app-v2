import type { Meta, StoryObj } from '@storybook/react';
import ReportOutputLayout from './ReportOutputLayout';

const meta: Meta<typeof ReportOutputLayout> = {
  title: 'Report output/ReportOutputLayout',
  component: ReportOutputLayout,
  args: {
    onTabChange: () => {},
    onEditName: () => {},
    onShare: () => {},
    onSave: () => {},
    onSidebarNavigate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReportOutputLayout>;

const societyWideTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'comparative', label: 'Comparative analysis' },
  { value: 'parameters', label: 'Policy parameters' },
];

const householdTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'household', label: 'Household details' },
  { value: 'parameters', label: 'Policy parameters' },
];

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
    timestamp: 'Ran today at 14:23:41',
    tabs: societyWideTabs,
    activeTab: 'overview',
    outputType: 'societyWide',
    showSidebar: false,
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
    tabs: householdTabs,
    activeTab: 'overview',
    outputType: 'household',
    showSidebar: false,
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
    tabs: societyWideTabs,
    activeTab: 'overview',
    outputType: 'societyWide',
    showSidebar: false,
    isSharedView: true,
    children: <PlaceholderContent text="Shared report content" />,
  },
};
