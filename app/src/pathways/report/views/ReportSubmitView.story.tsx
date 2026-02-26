import type { Meta, StoryObj } from '@storybook/react';
import type { ReportStateProps } from '@/types/pathwayState';
import ReportSubmitView from './ReportSubmitView';

const meta: Meta<typeof ReportSubmitView> = {
  title: 'Report creation/ReportSubmitView',
  component: ReportSubmitView,
  args: {
    onSubmit: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReportSubmitView>;

const readyReport: ReportStateProps = {
  label: 'CTC expansion analysis',
  year: '2026',
  countryId: 'us',
  apiVersion: null,
  status: 'pending',
  simulations: [
    {
      id: 'sim-1',
      label: 'Baseline 2026',
      policy: { id: 'pol-1', label: 'Current law', parameters: [] },
      population: {
        label: 'National households',
        type: 'geography',
        household: null,
        geography: {
          id: 'us-national',
          countryId: 'us',
          scope: 'national',
          geographyId: 'us',
        },
      },
    },
    {
      id: 'sim-2',
      label: 'Reform: CTC $4,000',
      policy: { id: 'pol-2', label: 'Expand CTC to $4,000', parameters: [] },
      population: {
        label: 'National households',
        type: 'geography',
        household: null,
        geography: {
          id: 'us-national',
          countryId: 'us',
          scope: 'national',
          geographyId: 'us',
        },
      },
    },
  ],
};

export const Ready: Story = {
  args: {
    reportState: readyReport,
    isSubmitting: false,
  },
};

export const Submitting: Story = {
  args: {
    reportState: readyReport,
    isSubmitting: true,
  },
};
