import type { Meta, StoryObj } from '@storybook/react';
import { withMockedProviders } from '@/tests/fixtures/storybook/storybookProviders';
import SimulationPolicySetupView from './SimulationPolicySetupView';

const meta: Meta<typeof SimulationPolicySetupView> = {
  title: 'Report creation/SimulationPolicySetupView',
  component: SimulationPolicySetupView,
  decorators: [withMockedProviders({ policies: true })],
  args: {
    onSelectCurrentLaw: () => {},
    onCreateNew: () => {},
    onLoadExisting: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SimulationPolicySetupView>;

export const Default: Story = {
  args: {
    currentLawId: 1,
    countryId: 'us',
  },
};
