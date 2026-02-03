import { vi } from 'vitest';
import { US_REGION_TYPES } from '@/types/regionTypes';
import { USScopeType } from '@/types/regionTypes';

// Mock state options
export const MOCK_STATE_OPTIONS = [
  { value: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
  { value: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
  { value: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
];

// Mock district options
export const MOCK_DISTRICT_OPTIONS = [
  {
    value: 'congressional_district/CA-01',
    label: "California's 1st congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'CA',
    stateName: 'California',
  },
  {
    value: 'congressional_district/CA-02',
    label: "California's 2nd congressional district",
    type: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
    stateAbbreviation: 'CA',
    stateName: 'California',
  },
];

// Test scope values
export const TEST_SCOPE_VALUES = {
  NATIONAL: US_REGION_TYPES.NATIONAL,
  STATE: US_REGION_TYPES.STATE,
  CONGRESSIONAL_DISTRICT: US_REGION_TYPES.CONGRESSIONAL_DISTRICT,
  PLACE: US_REGION_TYPES.PLACE,
  HOUSEHOLD: 'household' as const,
};

// Default props for testing
export const DEFAULT_PROPS = {
  scope: US_REGION_TYPES.NATIONAL as USScopeType,
  selectedRegion: '',
  stateOptions: MOCK_STATE_OPTIONS,
  districtOptions: MOCK_DISTRICT_OPTIONS,
  onScopeChange: vi.fn(),
  onRegionChange: vi.fn(),
};

// Factory function to create fresh props for each test
export function createMockProps(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  return {
    scope: US_REGION_TYPES.NATIONAL as USScopeType,
    selectedRegion: '',
    stateOptions: [...MOCK_STATE_OPTIONS],
    districtOptions: [...MOCK_DISTRICT_OPTIONS],
    onScopeChange: vi.fn(),
    onRegionChange: vi.fn(),
    ...overrides,
  };
}

// Radio button labels
export const RADIO_LABELS = {
  NATIONAL: 'All households nationally',
  STATE: 'All households in a state or federal district',
  CONGRESSIONAL_DISTRICT: 'All households in a congressional district',
  PLACE: 'All households in a municipality',
  HOUSEHOLD: 'Custom household',
} as const;
