import type { Meta, StoryObj } from '@storybook/react';
import type { PopulationStateProps } from '@/types/pathwayState';
import PopulationLabelView from './PopulationLabelView';

const meta: Meta<typeof PopulationLabelView> = {
  title: 'Report creation/PopulationLabelView',
  component: PopulationLabelView,
  args: {
    onUpdateLabel: () => {},
    onNext: () => {},
    onBack: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PopulationLabelView>;

const emptyPopulation: PopulationStateProps = {
  label: null,
  type: null,
  household: null,
  geography: null,
};

const geographicPopulation: PopulationStateProps = {
  label: 'California households',
  type: 'geography',
  household: null,
  geography: {
    id: 'us-ca',
    countryId: 'us',
    scope: 'subnational',
    geographyId: 'ca',
    name: 'California',
  },
};

export const Empty: Story = {
  args: {
    population: emptyPopulation,
    mode: 'standalone',
  },
};

export const Prefilled: Story = {
  args: {
    population: geographicPopulation,
    mode: 'report',
    simulationIndex: 0,
    reportLabel: 'CTC expansion analysis',
  },
};
