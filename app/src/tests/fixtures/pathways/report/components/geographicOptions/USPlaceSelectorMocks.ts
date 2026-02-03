import { vi } from 'vitest';

// Test place region strings
export const TEST_PLACE_REGIONS = {
  PATERSON_NJ: 'place/NJ-57000',
  LAS_VEGAS_NV: 'place/NV-40000',
  NYC: 'place/NY-51000',
  EMPTY: '',
} as const;

// Mock state names for dropdown display
export const MOCK_STATE_NAMES = {
  NEW_JERSEY: 'New Jersey',
  NEVADA: 'Nevada',
  NEW_YORK: 'New York',
  CALIFORNIA: 'California',
} as const;

// Mock place data returned from regionStrategies
export const MOCK_PLACES_NEW_JERSEY = [
  { placeFips: '21000', name: 'Elizabeth city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '36000', name: 'Jersey City city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '51000', name: 'Newark city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '57000', name: 'Paterson city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
];

export const MOCK_PLACES_NEVADA = [
  { placeFips: '31900', name: 'Henderson city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '40000', name: 'Las Vegas city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '51800', name: 'North Las Vegas city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '60600', name: 'Reno city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '68400', name: 'Sparks city', stateAbbrev: 'NV', stateName: 'Nevada' },
];

// Default props for testing
export const DEFAULT_PROPS = {
  selectedPlace: '',
  onPlaceChange: vi.fn(),
};

// Props with selected place
export const PROPS_WITH_SELECTED_PLACE = {
  selectedPlace: TEST_PLACE_REGIONS.PATERSON_NJ,
  onPlaceChange: vi.fn(),
};

// Factory function to create fresh props for each test
export function createMockProps(overrides = {}) {
  return {
    selectedPlace: '',
    onPlaceChange: vi.fn(),
    ...overrides,
  };
}
