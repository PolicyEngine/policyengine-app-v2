import { Household } from '@/types/ingredients/Household';
import { Geography } from '@/types/ingredients/Geography';
import { Population } from '@/types/ingredients/Population';

// Test labels
export const TEST_LABEL = 'Test Population';
export const TEST_LABEL_UPDATED = 'Updated Population';

// Mock Households
export const mockHousehold1: Household = {
  id: 'household-123',
  countryId: 'us',
  householdData: {
    people: {},
  },
};

export const mockHousehold2: Household = {
  id: 'household-456',
  countryId: 'uk',
  householdData: {
    people: {},
  },
};

// Mock Geographies
export const mockGeography1: Geography = {
  id: 'geo-123',
  countryId: 'us',
  scope: 'national',
  geographyId: 'us',
};

export const mockGeography2: Geography = {
  id: 'geo-456',
  countryId: 'uk',
  scope: 'subnational',
  geographyId: 'scotland',
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