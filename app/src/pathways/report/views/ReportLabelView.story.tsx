import type { Meta, StoryObj } from '@storybook/react';
import { withMockedProviders } from '@/tests/fixtures/storybook/storybookProviders';
import ReportLabelView from './ReportLabelView';

const meta: Meta<typeof ReportLabelView> = {
  title: 'Report creation/ReportLabelView',
  component: ReportLabelView,
  decorators: [withMockedProviders()],
  args: {
    onUpdateLabel: () => {},
    onUpdateYear: () => {},
    onNext: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReportLabelView>;

export const Empty: Story = {
  args: {
    label: null,
    year: null,
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Expand Child Tax Credit to $4,000',
    year: '2026',
  },
};
