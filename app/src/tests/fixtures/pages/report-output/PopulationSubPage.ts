import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Mock data for PopulationSubPage tests (Design 4 format)
 * Now uses baseline/reform simulations to determine populations
 */

// Test IDs
export const TEST_HOUSEHOLD_IDS = {
  FAMILY_OF_FOUR: 'hh-family-four-123',
  SINGLE_PERSON: 'hh-single-person-456',
} as const;

export const TEST_GEOGRAPHY_IDS = {
  CALIFORNIA: 'geo-us-ca',
  NEW_YORK: 'geo-us-ny',
} as const;

export const TEST_SIMULATION_IDS = {
  BASELINE: 'sim-baseline-123',
  REFORM: 'sim-reform-456',
} as const;

export const TEST_USER_ID = 'user-xyz-789';

// Mock Households
export const mockHouseholdFamilyOfFour: Household = {
  id: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  countryId: 'us',
  householdData: {
    people: {
      person1: {
        age: { '2024': 35 },
        employment_income: { '2024': 50000 },
      },
      person2: {
        age: { '2024': 33 },
        employment_income: { '2024': 45000 },
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
      },
    },
    taxUnits: {
      taxUnit1: {
        members: ['person1', 'person2'],
      },
    },
    households: {
      'household-1': {
        members: ['person1', 'person2'],
        state_name: { '2024': 'CA' },
      },
    },
  },
};

export const mockHouseholdSinglePerson: Household = {
  id: TEST_HOUSEHOLD_IDS.SINGLE_PERSON,
  countryId: 'us',
  householdData: {
    people: {
      person1: {
        age: { '2024': 28 },
        employment_income: { '2024': 60000 },
      },
    },
    families: {
      family1: {
        members: ['person1'],
      },
    },
    taxUnits: {
      taxUnit1: {
        members: ['person1'],
      },
    },
    households: {
      'household-1': {
        members: ['person1'],
        state_name: { '2024': 'NY' },
      },
    },
  },
};

// Mock Geographies
export const mockGeographyCalifornia: Geography = {
  id: TEST_GEOGRAPHY_IDS.CALIFORNIA,
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'ca',
  name: 'California',
};

export const mockGeographyNewYork: Geography = {
  id: TEST_GEOGRAPHY_IDS.NEW_YORK,
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'ny',
  name: 'New York',
};

// Mock Simulations
export const mockSimulationBaselineHousehold: Simulation = {
  id: TEST_SIMULATION_IDS.BASELINE,
  countryId: 'us',
  policyId: 'policy-baseline',
  populationId: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  populationType: 'household',
  label: 'Baseline Simulation',
  isCreated: true,
};

export const mockSimulationReformHousehold: Simulation = {
  id: TEST_SIMULATION_IDS.REFORM,
  countryId: 'us',
  policyId: 'policy-reform',
  populationId: TEST_HOUSEHOLD_IDS.SINGLE_PERSON,
  populationType: 'household',
  label: 'Reform Simulation',
  isCreated: true,
};

export const mockSimulationBaselineGeography: Simulation = {
  id: TEST_SIMULATION_IDS.BASELINE,
  countryId: 'us',
  policyId: 'policy-baseline',
  populationId: TEST_GEOGRAPHY_IDS.CALIFORNIA,
  populationType: 'geography',
  label: 'Baseline Simulation',
  isCreated: true,
};

export const mockSimulationReformGeography: Simulation = {
  id: TEST_SIMULATION_IDS.REFORM,
  countryId: 'us',
  policyId: 'policy-reform',
  populationId: TEST_GEOGRAPHY_IDS.NEW_YORK,
  populationType: 'geography',
  label: 'Reform Simulation',
  isCreated: true,
};

// Simulations with same population (for column collapsing tests)
export const mockSimulationReformSameHousehold: Simulation = {
  ...mockSimulationReformHousehold,
  populationId: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR, // Same as baseline
};

export const mockSimulationReformSameGeography: Simulation = {
  ...mockSimulationReformGeography,
  populationId: TEST_GEOGRAPHY_IDS.CALIFORNIA, // Same as baseline
};

// Mock User Household
export const mockUserHousehold: UserHouseholdPopulation = {
  id: 'user-hh-123',
  type: 'household',
  userId: TEST_USER_ID,
  householdId: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  countryId: 'us',
  label: 'Family of Four',
  createdAt: '2025-01-15T14:00:00Z',
};

// Test prop configurations for Design 4 format
export const createPopulationSubPageProps = {
  // Household scenarios
  householdDifferent: () => ({
    baselineSimulation: mockSimulationBaselineHousehold,
    reformSimulation: mockSimulationReformHousehold,
    households: [mockHouseholdFamilyOfFour, mockHouseholdSinglePerson],
    geographies: [],
    userHouseholds: [mockUserHousehold],
  }),
  householdSame: () => ({
    baselineSimulation: mockSimulationBaselineHousehold,
    reformSimulation: mockSimulationReformSameHousehold,
    households: [mockHouseholdFamilyOfFour],
    geographies: [],
    userHouseholds: [mockUserHousehold],
  }),
  householdMissingData: () => ({
    baselineSimulation: mockSimulationBaselineHousehold,
    reformSimulation: mockSimulationReformHousehold,
    households: [], // No households available
    geographies: [],
    userHouseholds: [],
  }),

  // Geography scenarios
  geographyDifferent: () => ({
    baselineSimulation: mockSimulationBaselineGeography,
    reformSimulation: mockSimulationReformGeography,
    households: [],
    geographies: [mockGeographyCalifornia, mockGeographyNewYork],
    userHouseholds: [],
  }),
  geographySame: () => ({
    baselineSimulation: mockSimulationBaselineGeography,
    reformSimulation: mockSimulationReformSameGeography,
    households: [],
    geographies: [mockGeographyCalifornia],
    userHouseholds: [],
  }),
  geographyMissingData: () => ({
    baselineSimulation: mockSimulationBaselineGeography,
    reformSimulation: mockSimulationReformGeography,
    households: [],
    geographies: [], // No geographies available
    userHouseholds: [],
  }),

  // Missing simulation scenarios
  noSimulations: () => ({
    baselineSimulation: undefined,
    reformSimulation: undefined,
    households: [],
    geographies: [],
    userHouseholds: [],
  }),
};
