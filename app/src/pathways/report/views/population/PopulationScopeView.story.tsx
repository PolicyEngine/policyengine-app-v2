import type { Meta, StoryObj } from '@storybook/react';
import PopulationScopeView from './PopulationScopeView';

const meta: Meta<typeof PopulationScopeView> = {
  title: 'Report creation/PopulationScopeView',
  component: PopulationScopeView,
  args: {
    onScopeSelected: () => {},
    onBack: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PopulationScopeView>;

// Mock region data for US states
const usRegionData = [
  { name: 'Alabama', id: 'al', type: 'state' },
  { name: 'Alaska', id: 'ak', type: 'state' },
  { name: 'Arizona', id: 'az', type: 'state' },
  { name: 'California', id: 'ca', type: 'state' },
  { name: 'Colorado', id: 'co', type: 'state' },
  { name: 'Florida', id: 'fl', type: 'state' },
  { name: 'New York', id: 'ny', type: 'state' },
  { name: 'Texas', id: 'tx', type: 'state' },
];

// Mock region data for UK constituencies
const ukRegionData = [
  { name: 'Sheffield Central', id: 'constituency/sheffield-central', type: 'constituency' },
  { name: 'Manchester Gorton', id: 'constituency/manchester-gorton', type: 'constituency' },
  { name: 'England', id: 'country/england', type: 'country' },
  { name: 'Scotland', id: 'country/scotland', type: 'country' },
  { name: 'Wales', id: 'country/wales', type: 'country' },
];

export const US: Story = {
  args: {
    countryId: 'us',
    regionData: usRegionData,
  },
};

export const UK: Story = {
  decorators: [
    (Story) => (
      // Override the MemoryRouter to set UK country context
      <Story />
    ),
  ],
  args: {
    countryId: 'uk',
    regionData: ukRegionData,
  },
};
