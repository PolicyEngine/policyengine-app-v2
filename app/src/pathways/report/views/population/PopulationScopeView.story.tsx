import type { Meta, StoryObj } from '@storybook/react';
import { UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';
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
  { name: 'state/al', label: 'Alabama', type: US_REGION_TYPES.STATE },
  { name: 'state/ak', label: 'Alaska', type: US_REGION_TYPES.STATE },
  { name: 'state/az', label: 'Arizona', type: US_REGION_TYPES.STATE },
  { name: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
  { name: 'state/co', label: 'Colorado', type: US_REGION_TYPES.STATE },
  { name: 'state/fl', label: 'Florida', type: US_REGION_TYPES.STATE },
  { name: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
  { name: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
];

// Mock region data for UK constituencies
const ukRegionData = [
  {
    name: 'constituency/Sheffield Central',
    label: 'Sheffield Central',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
  {
    name: 'constituency/Manchester Gorton',
    label: 'Manchester Gorton',
    type: UK_REGION_TYPES.CONSTITUENCY,
  },
  { name: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
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
