import { MetadataRegion } from '@/utils/regionStrategies';

// Test region values
export const TEST_REGIONS = {
  UK_CONSTITUENCY_PREFIXED: 'constituency/Sheffield Central',
  UK_CONSTITUENCY_DISPLAY: 'Sheffield Central',
  UK_COUNTRY_PREFIXED: 'country/england',
  UK_COUNTRY_DISPLAY: 'england',
  US_STATE: 'ca',
  US_STATE_NY: 'ny',
  UK_NATIONAL: 'uk',
  US_NATIONAL: 'us',
} as const;

// Mock metadata regions for UK
export const mockUKRegions: MetadataRegion[] = [
  { name: 'uk', label: 'the UK' },
  { name: 'country/england', label: 'England' },
  { name: 'country/scotland', label: 'Scotland' },
  { name: 'country/wales', label: 'Wales' },
  { name: 'country/ni', label: 'Northern Ireland' },
  { name: 'constituency/Sheffield Central', label: 'Sheffield Central' },
  { name: 'constituency/Manchester Central', label: 'Manchester Central' },
  { name: 'constituency/Brighton Pavilion', label: 'Brighton Pavilion' },
];

// Mock metadata regions for US
export const mockUSRegions: MetadataRegion[] = [
  { name: 'us', label: 'the US' },
  { name: 'ca', label: 'California' },
  { name: 'ny', label: 'New York' },
  { name: 'tx', label: 'Texas' },
  { name: 'fl', label: 'Florida' },
];

// Expected region options after filtering
export const expectedUSStates = [
  { value: 'ca', label: 'California' },
  { value: 'ny', label: 'New York' },
  { value: 'tx', label: 'Texas' },
  { value: 'fl', label: 'Florida' },
];

export const expectedUKCountries = [
  { value: 'country/england', label: 'England' },
  { value: 'country/scotland', label: 'Scotland' },
  { value: 'country/wales', label: 'Wales' },
  { value: 'country/ni', label: 'Northern Ireland' },
];

export const expectedUKConstituencies = [
  { value: 'constituency/Sheffield Central', label: 'Sheffield Central' },
  { value: 'constituency/Manchester Central', label: 'Manchester Central' },
  { value: 'constituency/Brighton Pavilion', label: 'Brighton Pavilion' },
];
