import type { Meta, StoryObj } from '@storybook/react';
import { withMockedProviders } from '@/tests/fixtures/storybook/storybookProviders';
import type { ReportStateProps } from '@/types/pathwayState';
import ReportSetupView from './ReportSetupView';

const meta: Meta<typeof ReportSetupView> = {
  title: 'Report creation/ReportSetupView',
  component: ReportSetupView,
  decorators: [withMockedProviders({ households: true, geographics: true })],
  args: {
    onNavigateToSimulationSelection: () => {},
    onNext: () => {},
    onPrefillPopulation2: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ReportSetupView>;

const emptyReport: ReportStateProps = {
  label: 'CTC expansion analysis',
  year: '2026',
  countryId: 'us',
  apiVersion: null,
  status: 'pending',
  simulations: [
    {
      label: null,
      policy: { label: null, parameters: [] },
      population: { label: null, type: null, household: null, geography: null },
    },
    {
      label: null,
      policy: { label: null, parameters: [] },
      population: { label: null, type: null, household: null, geography: null },
    },
  ],
};

const oneSimulationReport: ReportStateProps = {
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
      label: null,
      policy: { label: null, parameters: [] },
      population: { label: null, type: null, household: null, geography: null },
    },
  ],
};

const bothSimulationsReport: ReportStateProps = {
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

export const NoSimulations: Story = {
  args: {
    reportState: emptyReport,
  },
};

export const OneSimulation: Story = {
  args: {
    reportState: oneSimulationReport,
  },
};

export const BothSimulations: Story = {
  args: {
    reportState: bothSimulationsReport,
  },
};
