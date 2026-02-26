import type { Meta, StoryObj } from '@storybook/react';
import { ChartContainer } from './ChartContainer';

const meta: Meta<typeof ChartContainer> = {
  title: 'Building blocks/ChartContainer',
  component: ChartContainer,
  args: {
    onDownloadCsv: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ChartContainer>;

const PlaceholderChart = () => (
  <div
    style={{
      height: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 4,
      color: '#868e96',
    }}
  >
    Chart placeholder
  </div>
);

export const WithTitle: Story = {
  args: {
    title: 'Budgetary impact by program',
    children: <PlaceholderChart />,
  },
};

export const WithLongTitle: Story = {
  args: {
    title:
      'Distributional impact of expanding the Child Tax Credit to $4,000 per child on household net income by income decile',
    children: <PlaceholderChart />,
  },
};

export const WithRichContent: Story = {
  args: {
    title: 'Net income change by income decile',
    children: (
      <div style={{ padding: 16 }}>
        <p style={{ color: '#495057', marginBottom: 8 }}>
          This chart shows the average change in household net income across income deciles.
        </p>
        <PlaceholderChart />
      </div>
    ),
  },
};
