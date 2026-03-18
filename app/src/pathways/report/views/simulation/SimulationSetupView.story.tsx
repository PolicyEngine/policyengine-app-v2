import type { Meta, StoryObj } from '@storybook/react';
import type { SimulationStateProps } from '@/types/pathwayState';
import SimulationSetupView from './SimulationSetupView';

const meta: Meta<typeof SimulationSetupView> = {
  title: 'Report creation/SimulationSetupView',
  component: SimulationSetupView,
  args: {
    onNavigateToPolicy: () => {},
    onNavigateToPopulation: () => {},
    onNext: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SimulationSetupView>;

const emptySimulation: SimulationStateProps = {
  label: null,
  policy: { label: null, parameters: [] },
  population: { label: null, type: null, household: null, geography: null },
};

const policyOnlySimulation: SimulationStateProps = {
  label: null,
  policy: { id: 'pol-42', label: 'Expand Child Tax Credit', parameters: [] },
  population: { label: null, type: null, household: null, geography: null },
};

const fullyConfiguredSimulation: SimulationStateProps = {
  id: 'sim-123',
  label: 'Baseline 2026',
  policy: { id: 'pol-42', label: 'Expand Child Tax Credit', parameters: [] },
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
};

export const Empty: Story = {
  args: {
    simulation: emptySimulation,
    simulationIndex: 0,
    isReportMode: true,
  },
};

export const PolicySelected: Story = {
  args: {
    simulation: policyOnlySimulation,
    simulationIndex: 0,
    isReportMode: true,
  },
};

export const FullyConfigured: Story = {
  args: {
    simulation: fullyConfiguredSimulation,
    simulationIndex: 0,
    isReportMode: true,
  },
};
