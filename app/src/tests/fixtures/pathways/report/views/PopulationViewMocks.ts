import { vi } from 'vitest';
import { PopulationStateProps } from '@/types/pathwayState';

export const TEST_POPULATION_LABEL = 'Test Population';
export const TEST_COUNTRY_ID = 'us';

export const mockOnUpdateLabel = vi.fn();
export const mockOnNext = vi.fn();
export const mockOnBack = vi.fn();
export const mockOnCancel = vi.fn();
export const mockOnScopeSelected = vi.fn();

export const mockPopulationStateEmpty: PopulationStateProps = {
  label: null,
  type: null,
  household: null,
  geography: null,
};

export const mockPopulationStateWithHousehold: PopulationStateProps = {
  label: 'My Household',
  type: 'household',
  household: {
    id: '789',
    countryId: 'us',
    householdData: {
      people: {},
    },
  },
  geography: null,
};

export const mockPopulationStateWithGeography: PopulationStateProps = {
  label: null,
  type: 'geography',
  household: null,
  geography: {
    countryId: 'us',
    regionCode: 'us',
  },
};

export const mockRegionData: any[] = [
  { name: 'Alabama', code: 'al', geography_id: 'us_al' },
  { name: 'California', code: 'ca', geography_id: 'us_ca' },
];

// Mock return value for useRegions hook (empty regions)
export const mockUseRegionsEmpty = {
  regions: [],
  isLoading: false,
  error: null,
  rawRegions: [],
};

export function resetAllMocks() {
  mockOnUpdateLabel.mockClear();
  mockOnNext.mockClear();
  mockOnBack.mockClear();
  mockOnCancel.mockClear();
  mockOnScopeSelected.mockClear();
}
