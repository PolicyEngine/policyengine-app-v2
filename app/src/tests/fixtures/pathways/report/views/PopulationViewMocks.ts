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
    label: 'My Household',
    people: {},
  },
  geography: null,
};

export const mockPopulationStateWithGeography: PopulationStateProps = {
  label: 'National Households',
  type: 'geography',
  household: null,
  geography: {
    id: undefined,
    geographyId: 'us',
    scope: 'national',
    name: 'United States',
  },
};

export const mockRegionData: any[] = [
  { name: 'Alabama', code: 'al', geography_id: 'us_al' },
  { name: 'California', code: 'ca', geography_id: 'us_ca' },
];

export function resetAllMocks() {
  mockOnUpdateLabel.mockClear();
  mockOnNext.mockClear();
  mockOnBack.mockClear();
  mockOnCancel.mockClear();
  mockOnScopeSelected.mockClear();
}
