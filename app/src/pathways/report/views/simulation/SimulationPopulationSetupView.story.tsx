import type { Meta, StoryObj } from '@storybook/react';
import { withMockedProviders } from '@/tests/fixtures/storybook/storybookProviders';
import SimulationPopulationSetupView from './SimulationPopulationSetupView';

const meta: Meta<typeof SimulationPopulationSetupView> = {
  title: 'Report creation/SimulationPopulationSetupView',
  component: SimulationPopulationSetupView,
  decorators: [withMockedProviders({ households: true, geographics: true })],
  args: {
    onCreateNew: () => {},
    onLoadExisting: () => {},
    onCopyExisting: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SimulationPopulationSetupView>;

export const Default: Story = {
  args: {
    isReportMode: false,
    otherSimulation: null,
    otherPopulation: null,
  },
};
