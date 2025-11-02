import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Population } from '@/types/ingredients/Population';

// Test labels
export const TEST_LABEL = 'Test Population';
export const TEST_LABEL_UPDATED = 'Updated Population';

// Mock Households
export const mockHousehold1: Household = {
  id: '123',
  countryId: 'us',
  householdData: {
    people: {},
  },
};

export const mockHousehold2: Household = {
  id: '456',
  countryId: 'uk',
  householdData: {
    people: {},
  },
};

// Mock Geographies
export const mockGeography1: Geography = {
  id: 'test-geography',
  countryId: 'us',
  scope: 'national',
  geographyId: 'us',
};

export const mockGeography2: Geography = {
  id: 'test-geography-2',
  countryId: 'uk',
  scope: 'subnational',
  geographyId: 'country/scotland', // NOW USING PREFIXED VALUE
};

// Mock Populations
export const mockPopulation1: Population = {
  label: TEST_LABEL,
  isCreated: true,
  household: mockHousehold1,
  geography: null,
};

export const mockPopulation2: Population = {
  label: 'Second Population',
  isCreated: false,
  household: null,
  geography: mockGeography1,
};

// Empty initial state for tests
export const emptyInitialState = {
  populations: [null, null] as [Population | null, Population | null],
};
