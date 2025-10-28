import { Population } from '@/types/ingredients/Population';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Test population IDs for compatibility testing
 */
export const TEST_POPULATION_IDS = {
  HOUSEHOLD_1: '12345',
  HOUSEHOLD_2: '67890',
  GEOGRAPHY_US: 'us',
  GEOGRAPHY_CA: 'us-ca',
} as const;

/**
 * Test simulation IDs
 */
export const TEST_SIMULATION_IDS = {
  SIMULATION_1: 'sim-001',
  SIMULATION_2: 'sim-002',
} as const;

/**
 * Creates a mock population with a household
 */
export function mockPopulationWithHousehold(householdId: string): Population {
  return {
    label: null,
    isCreated: true,
    household: {
      id: householdId,
      countryId: 'us',
      householdData: {
        people: {},
      },
    },
    geography: null,
  };
}

/**
 * Creates a mock population with a geography
 */
export function mockPopulationWithGeography(
  name: string | undefined,
  geographyId: string
): Population {
  return {
    label: null,
    isCreated: true,
    household: null,
    geography: {
      id: geographyId,
      countryId: 'us',
      scope: 'subnational',
      geographyId,
      name,
    },
  };
}

/**
 * Creates a mock population with a custom label
 */
export function mockPopulationWithLabel(label: string): Population {
  return {
    label,
    isCreated: true,
    household: null,
    geography: null,
  };
}

/**
 * Creates an empty mock population
 */
export function mockPopulationEmpty(): Population {
  return {
    label: null,
    isCreated: false,
    household: null,
    geography: null,
  };
}

/**
 * Creates a mock simulation with a label
 */
export function mockSimulationWithLabel(label: string): Simulation {
  return {
    label,
    isCreated: true,
  };
}

/**
 * Creates a mock simulation with an ID
 */
export function mockSimulationWithId(id: string | undefined): Simulation {
  return {
    id,
    label: null,
    isCreated: true,
  };
}
