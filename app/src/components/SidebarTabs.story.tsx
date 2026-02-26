import type { Meta, StoryObj } from '@storybook/react';
import { SidebarTabs } from './SidebarTabs';

const sampleTabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'distributional', label: 'Distributional impact' },
  { value: 'poverty', label: 'Poverty impact' },
];

const TabContent = ({ tab }: { tab: string }) => (
  <div
    style={{
      padding: 24,
      backgroundColor: '#f8f9fa',
      borderRadius: 4,
      minHeight: 200,
      color: '#495057',
    }}
  >
    Content for {tab} tab
  </div>
);

const meta: Meta<typeof SidebarTabs> = {
  title: 'Building blocks/SidebarTabs',
  component: SidebarTabs,
  args: {
    tabs: sampleTabs,
    onTabChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SidebarTabs>;

export const Default: Story = {
  args: {
    activeTab: 'overview',
    children: <TabContent tab="overview" />,
  },
};

export const SecondActive: Story = {
  args: {
    activeTab: 'distributional',
    children: <TabContent tab="distributional impact" />,
  },
};
