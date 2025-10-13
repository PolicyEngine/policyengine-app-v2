import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { TEST_POLICY_IDS } from './PolicySubPage';

/**
 * Mock data for SimulationSubPage tests
 */

// Test IDs
export const TEST_SIMULATION_IDS = {
  BASELINE: 'sim-baseline-abc',
  REFORM: 'sim-reform-def',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  FAMILY_OF_FOUR: 'hh-family-four-123',
} as const;

export const TEST_GEOGRAPHY_IDS = {
  CALIFORNIA: 'geo-us-ca',
} as const;

export const TEST_USER_ID = 'user-xyz-789';

// Mock Simulations
export const mockBaselineSimulation: Simulation = {
  id: TEST_SIMULATION_IDS.BASELINE,
  countryId: 'us',
  apiVersion: '1.0',
  policyId: TEST_POLICY_IDS.BASELINE,
  populationId: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  populationType: 'household',
  label: 'Baseline Simulation',
  isCreated: true,
};

export const mockReformSimulation: Simulation = {
  id: TEST_SIMULATION_IDS.REFORM,
  countryId: 'us',
  apiVersion: '1.0',
  policyId: TEST_POLICY_IDS.REFORM,
  populationId: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  populationType: 'household',
  label: 'Reform Simulation',
  isCreated: true,
};

export const mockGeographySimulation: Simulation = {
  id: 'sim-geography-123',
  countryId: 'us',
  apiVersion: '1.0',
  policyId: TEST_POLICY_IDS.BASELINE,
  populationId: TEST_GEOGRAPHY_IDS.CALIFORNIA,
  populationType: 'geography',
  label: 'California Simulation',
  isCreated: true,
};

// Mock User Simulations
export const mockUserBaselineSimulation: UserSimulation = {
  id: 'user-sim-baseline-abc',
  userId: TEST_USER_ID,
  simulationId: TEST_SIMULATION_IDS.BASELINE,
  label: 'My Baseline Simulation',
  createdAt: '2025-01-15T12:00:00Z',
};

export const mockUserReformSimulation: UserSimulation = {
  id: 'user-sim-reform-def',
  userId: TEST_USER_ID,
  simulationId: TEST_SIMULATION_IDS.REFORM,
  label: 'My Reform Simulation',
  createdAt: '2025-01-15T13:00:00Z',
};

// Mock Household (used by simulations)
export const mockHousehold: Household = {
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
        state: { '2024': 'CA' },
      },
    },
  },
};

// Mock Geography
export const mockGeography: Geography = {
  id: TEST_GEOGRAPHY_IDS.CALIFORNIA,
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'ca',
  name: 'California',
};

// Test prop configurations (helpers for common test scenarios)
export const createSimulationSubPageProps = {
  empty: () => ({
    simulations: [],
    policies: [],
    households: [],
    geographies: [],
    userSimulations: [],
  }),
  undefined: () => ({
    simulations: undefined,
    policies: undefined,
    households: undefined,
    geographies: undefined,
    userSimulations: undefined,
  }),
  singleSimulation: () => ({
    simulations: [mockBaselineSimulation],
    policies: [],
    households: [mockHousehold],
    geographies: [],
    userSimulations: [mockUserBaselineSimulation],
  }),
  baselineAndReform: () => ({
    simulations: [mockBaselineSimulation, mockReformSimulation],
    policies: [],
    households: [mockHousehold],
    geographies: [],
    userSimulations: [],
  }),
  withGeography: () => ({
    simulations: [mockGeographySimulation],
    policies: [],
    households: [],
    geographies: [mockGeography],
    userSimulations: [],
  }),
};
